#!/usr/bin/env node
// Simple health check script for Docker
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 8787,
  path: '/healthz',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
