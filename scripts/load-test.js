#!/usr/bin/env node

/**
 * Load test script for Anqor API
 * Tests the API at increasing concurrency levels to find breaking point
 */

const http = require('http');
const { URL } = require('url');

const API_BASE = process.env.API_BASE || 'http://localhost:8787';
const TEST_DURATION_MS = parseInt(process.env.TEST_DURATION_MS || '10000', 10);
const START_CONCURRENCY = parseInt(process.env.START_CONCURRENCY || '1', 10);
const MAX_CONCURRENCY = parseInt(process.env.MAX_CONCURRENCY || '100', 10);
const STEP = parseInt(process.env.STEP || '5', 10);

// Sample claim data for testing
const SAMPLE_CLAIM = {
  claim_type: 'auto',
  months_as_customer: 12,
  policy_deductable: 500,
  policy_annual_premium: 1200,
  umbrella_limit: 1000000,
  capital_gains: 0,
  capital_loss: 0,
  incident_hour_of_the_day: 14,
  number_of_vehicles_involved: 1,
  bodily_injuries: 0,
  witnesses: 1,
  injury_claim: 0,
  property_claim: 3000,
  vehicle_claim: 5000,
  auto_year: 2018,
  insured_sex: 'MALE',
  insured_education_level: 'College',
  insured_occupation: 'prof-specialty',
  insured_hobbies: 'reading',
  insured_relationship: 'husband',
  policy_csl: '250/500',
  incident_type: 'Single Vehicle Collision',
  collision_type: 'Front Collision',
  incident_severity: 'Minor Damage',
  authorities_contacted: 'Police',
  auto_make: 'Toyota',
  property_damage: 'YES',
  police_report_available: 'YES',
};

async function sendRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };

    const req = http.request(url, options, (res) => {
      const startTime = Date.now();
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          duration: Date.now() - startTime,
          success: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        duration: 0,
        success: false,
        error: err.message,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runLoadTest(concurrency) {
  console.log(`\n[TEST] Running load test with concurrency: ${concurrency}`);
  console.log(`[TEST] Duration: ${TEST_DURATION_MS}ms`);

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    timeouts: 0,
    durations: [],
  };

  const startTime = Date.now();
  const endTime = startTime + TEST_DURATION_MS;

  async function worker() {
    while (Date.now() < endTime) {
      const result = await sendRequest('/api/v1/health');
      results.total++;
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        if (result.error === 'timeout') results.timeouts++;
      }
      results.durations.push(result.duration);
      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Start workers
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Calculate statistics
  results.durations.sort((a, b) => a - b);
  const avgDuration = results.durations.reduce((a, b) => a + b, 0) / results.durations.length;
  const p50 = results.durations[Math.floor(results.durations.length * 0.5)];
  const p95 = results.durations[Math.floor(results.durations.length * 0.95)];
  const p99 = results.durations[Math.floor(results.durations.length * 0.99)];
  const successRate = (results.success / results.total) * 100;

  console.log(`[RESULTS] Total requests: ${results.total}`);
  console.log(`[RESULTS] Success rate: ${successRate.toFixed(2)}%`);
  console.log(`[RESULTS] Avg duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`[RESULTS] P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms`);
  console.log(`[RESULTS] Timeouts: ${results.timeouts}`);

  return {
    concurrency,
    ...results,
    avgDuration,
    p50,
    p95,
    p99,
    successRate,
  };
}

async function main() {
  console.log('=== Anqor API Load Test ===');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test duration per level: ${TEST_DURATION_MS}ms`);
  console.log(`Concurrency range: ${START_CONCURRENCY} - ${MAX_CONCURRENCY} (step: ${STEP})`);

  const allResults = [];
  let breakingPoint = null;

  for (let concurrency = START_CONCURRENCY; concurrency <= MAX_CONCURRENCY; concurrency += STEP) {
    const result = await runLoadTest(concurrency);
    allResults.push(result);

    // Check if we've hit the breaking point (success rate < 95% or high error rate)
    if (!breakingPoint && (result.successRate < 95 || result.p95 > 5000)) {
      breakingPoint = concurrency;
      console.log(`\n[BREAKING POINT] Detected at concurrency: ${breakingPoint}`);
      console.log(`  Success rate: ${result.successRate.toFixed(2)}%`);
      console.log(`  P95 latency: ${result.p95}ms`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Concurrency | Success Rate | Avg (ms) | P95 (ms) | P99 (ms)');
  console.log('-'.repeat(70));
  for (const r of allResults) {
    console.log(
      `${String(r.concurrency).padEnd(12)} | ${r.successRate.toFixed(2).padEnd(13)} | ${r.avgDuration.toFixed(2).padEnd(9)} | ${r.p95.toString().padEnd(9)} | ${r.p99}`
    );
  }

  if (breakingPoint) {
    console.log(`\n⚠️  Breaking point detected at ~${breakingPoint}x concurrent requests`);
    console.log(`   Consider scaling when concurrency approaches ${Math.floor(breakingPoint * 0.7)}x`);
  } else {
    console.log('\n✅ No breaking point detected within test range');
    console.log(`   The system handled up to ${MAX_CONCURRENCY}x concurrency`);
  }

  // Save results to file
  const fs = require('fs');
  const resultFile = `load-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultFile, JSON.stringify(allResults, null, 2));
  console.log(`\nResults saved to: ${resultFile}`);
}

main().catch(console.error);
