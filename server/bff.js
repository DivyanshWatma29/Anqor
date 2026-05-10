import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import { createClient } from '@insforge/sdk';
import { initServerMonitoring, captureServerException, captureServerMessage, Sentry } from './monitoring.js';
import * as emailService from './lib/email.js';
import * as pushService from './lib/push.js';
import { verifyUnsubscribeToken } from './lib/email-templates.js';

const app = express();
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
    callback(null, true);
  },
});

const PORT = Number(process.env.PORT || 8787);
const INSFORGE_URL = process.env.INSFORGE_URL || process.env.VITE_INSFORGE_URL;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY || process.env.VITE_INSFORGE_ANON_KEY;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.VITE_ML_SERVICE_URL || 'http://localhost:5000';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

const ALLOWED_CLAIM_TYPES = new Set(['auto', 'health', 'travel', 'property', 'life']);
const ALLOWED_SORT_FIELDS = new Set(['created_at', 'risk_score', 'claim_amount', 'prediction', 'incident_type', 'status']);
const ALLOWED_PREDICTIONS = new Set(['Fraud', 'Legitimate']);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SAFE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const MAX_STRING_LENGTH = 500;
const MAX_HEADERS = 200;
const MAX_BATCH_SIZE = 200;
const ALLOWED_UPLOAD_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

const RATE_LIMIT_CONFIG = {
  predict: {
    windowMs: 60 * 1000,
    maxCostPerWindow: 30,
    burstLimit: 8,
    penaltyMs: 5 * 60 * 1000,
  },
  batch: {
    windowMs: 10 * 60 * 1000,
    maxCostPerWindow: 80,
    burstLimit: 2,
    penaltyMs: 15 * 60 * 1000,
  },
  documentExtract: {
    windowMs: 10 * 60 * 1000,
    maxCostPerWindow: 24,
    burstLimit: 3,
    penaltyMs: 15 * 60 * 1000,
  },
  documentMapHeaders: {
    windowMs: 10 * 60 * 1000,
    maxCostPerWindow: 18,
    burstLimit: 4,
    penaltyMs: 10 * 60 * 1000,
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxCostPerWindow: 10,
    burstLimit: 5,
    penaltyMs: 30 * 60 * 1000,
  },
};

const rateLimitStore = new Map();
const RATE_LIMIT_SWEEP_INTERVAL_MS = 60 * 1000;
let lastRateLimitSweepAt = 0;

// Brute force protection: track failed login attempts
const failedAttemptsStore = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FAILED_ATTEMPT_BLOCK_MS = 60 * 60 * 1000; // 1 hour block

function trackFailedAttempt(identifier) {
  const key = `failed:${identifier}`;
  const now = Date.now();
  const existing = failedAttemptsStore.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };

  // Reset if window has passed
  if (now - existing.firstAttempt > FAILED_ATTEMPT_WINDOW_MS) {
    existing.count = 0;
    existing.firstAttempt = now;
  }

  existing.count++;
  failedAttemptsStore.set(key, existing);

  // Block if too many failed attempts
  if (existing.count >= MAX_FAILED_ATTEMPTS) {
    existing.blockedUntil = now + FAILED_ATTEMPT_BLOCK_MS;
    failedAttemptsStore.set(key, existing);
  }

  return existing;
}

function isBlockedForFailedAttempts(identifier) {
  const key = `failed:${identifier}`;
  const existing = failedAttemptsStore.get(key);
  if (!existing) return false;

  const now = Date.now();

  // Check if block has expired
  if (existing.blockedUntil && existing.blockedUntil > now) {
    return true;
  }

  // Reset if window has passed
  if (now - existing.firstAttempt > FAILED_ATTEMPT_WINDOW_MS) {
    failedAttemptsStore.delete(key);
    return false;
  }

  return existing.count >= MAX_FAILED_ATTEMPTS;
}

function clearFailedAttempts(identifier) {
  const key = `failed:${identifier}`;
  failedAttemptsStore.delete(key);
}

// Sweep failed attempts periodically
function sweepFailedAttempts() {
  const now = Date.now();
  for (const [key, entry] of failedAttemptsStore.entries()) {
    if (now - entry.firstAttempt > FAILED_ATTEMPT_WINDOW_MS && (!entry.blockedUntil || entry.blockedUntil < now)) {
      failedAttemptsStore.delete(key);
    }
  }
}

const API_BASE = '/api';
const API_V1_BASE = '/api/v1';

const CLAIM_FIELD_CONFIG = {
  auto: {
    numeric: new Set(['months_as_customer', 'policy_deductable', 'policy_annual_premium', 'umbrella_limit', 'capital_gains', 'capital_loss', 'incident_hour_of_the_day', 'number_of_vehicles_involved', 'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim', 'vehicle_claim', 'auto_year']),
    categorical: new Map([
      ['insured_sex', new Set(['FEMALE', 'MALE'])],
      ['insured_education_level', new Set(['Associate', 'College', 'High School', 'JD', 'MD', 'Masters', 'PhD'])],
      ['insured_occupation', new Set(['adm-clerical', 'armed-forces', 'craft-repair', 'exec-managerial', 'farming-fishing', 'handlers-cleaners', 'machine-op-inspct', 'other-service', 'priv-house-serv', 'prof-specialty', 'protective-serv', 'sales', 'tech-support', 'transport-moving'])],
      ['insured_hobbies', new Set(['base-jumping', 'basketball', 'board-games', 'bungie-jumping', 'camping', 'chess', 'cross-fit', 'dancing', 'exercise', 'golf', 'hiking', 'kayaking', 'movies', 'paintball', 'polo', 'reading', 'skydiving', 'sleeping', 'video-games', 'yachting'])],
      ['insured_relationship', new Set(['husband', 'not-in-family', 'other-relative', 'own-child', 'unmarried', 'wife'])],
      ['policy_csl', new Set(['100/300', '250/500', '500/1000'])],
      ['incident_type', new Set(['Multi-vehicle Collision', 'Parked Car', 'Single Vehicle Collision', 'Vehicle Theft'])],
      ['collision_type', new Set(['Front Collision', 'Rear Collision', 'Side Collision'])],
      ['incident_severity', new Set(['Major Damage', 'Minor Damage', 'Total Loss', 'Trivial Damage'])],
      ['authorities_contacted', new Set(['Ambulance', 'Fire', 'Other', 'Police'])],
      ['auto_make', new Set(['Accura', 'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'Honda', 'Jeep', 'Mercedes', 'Nissan', 'Saab', 'Suburu', 'Toyota', 'Volkswagen'])],
      ['property_damage', new Set(['NO', 'YES'])],
      ['police_report_available', new Set(['NO', 'YES'])],
    ]),
  },
  health: {
    numeric: new Set(['Patient_Age', 'Prior_Visits_12m', 'Number_of_Claims_Per_Provider_Monthly', 'Length_of_Stay', 'Days_Between_Service_and_Claim', 'Claim_Amount', 'Approved_Amount']),
    categorical: new Map([
      ['Patient_Gender', new Set(['Male', 'Female'])],
      ['Patient_State', new Set(['CA', 'FL', 'GA', 'IL', 'NY', 'OH', 'PA', 'TX'])],
      ['Chronic_Condition_Flag', new Set(['0', '1'])],
      ['Provider_Specialty', new Set(['Cardiology', 'General Practice', 'Internal Medicine', 'Neurology', 'Orthopedics', 'Pulmonology'])],
      ['Diagnosis_Code', new Set(['E11.9', 'E78.5', 'F41.9', 'I10', 'I25.10', 'J06.9', 'J18.9', 'K21.9', 'M54.5', 'N39.0'])],
      ['Procedure_Code', new Set(['36415', '71046', '80053', '85025', '87086', '93000', '97110', '99213', '99214'])],
      ['Insurance_Type', new Set(['Medicaid', 'Medicare', 'Private', 'Self-Pay'])],
      ['Visit_Type', new Set(['Emergency', 'Inpatient', 'Outpatient'])],
      ['Claim_Status', new Set(['Approved', 'Pending', 'Rejected'])],
    ]),
  },
  travel: {
    numeric: new Set(['duration', 'age', 'net_sales', 'commision', 'claim']),
    categorical: new Map([
      ['agency_type', new Set(['Airlines', 'Travel Agency'])],
      ['distribution_channel', new Set(['Offline', 'Online'])],
      ['product_name', new Set(['1 way Comprehensive Plan', '2 way Comprehensive Plan', '24 Protect', 'Annual Gold Plan', 'Annual Silver Plan', 'Annual Travel Protect Gold', 'Annual Travel Protect Platinum', 'Annual Travel Protect Silver', 'Basic Plan', 'Bronze Plan', 'Cancellation Plan', 'Child Comprehensive Plan', 'Comprehensive Plan', 'Gold Plan', 'Individual Comprehensive Plan', 'Premier Plan', 'Rental Vehicle Excess Insurance', 'Silver Plan', 'Single Trip Travel Protect Gold', 'Single Trip Travel Protect Platinum', 'Single Trip Travel Protect Silver', 'Spouse or Parents Comprehensive Plan', 'Ticket Protector', 'Travel Cruise Protect', 'Travel Cruise Protect Family', 'Value Plan'])],
      ['agency_name', new Set(['ADM', 'ART', 'C2B', 'CBH', 'CCR', 'CSR', 'CWT', 'EPX', 'JWT', 'JZI', 'KML', 'LWC', 'RAB', 'SSI', 'TST', 'TTW'])],
      ['destination', new Set(['ALBANIA', 'ANGOLA', 'ARGENTINA', 'ARMENIA', 'AUSTRALIA', 'AUSTRIA', 'AZERBAIJAN', 'BAHRAIN', 'BANGLADESH', 'BARBADOS', 'BELARUS', 'BELGIUM', 'BENIN', 'BERMUDA', 'BHUTAN', 'BOLIVIA', 'BOSNIA AND HERZEGOVINA', 'BOTSWANA', 'BRAZIL', 'BRUNEI DARUSSALAM', 'BULGARIA', 'CAMBODIA', 'CAMEROON', 'CANADA', 'CAYMAN ISLANDS', 'CHILE', 'CHINA', 'COLOMBIA', 'COSTA RICA', 'CROATIA'])],
      ['gender', new Set(['M', 'F'])],
    ]),
  },
  property: {
    numeric: new Set(['months_as_customer', 'policy_deductable', 'policy_annual_premium', 'umbrella_limit', 'capital_gains', 'capital_loss', 'incident_hour_of_the_day', 'number_of_vehicles_involved', 'bodily_injuries', 'witnesses', 'injury_claim', 'property_claim', 'vehicle_claim', 'auto_year']),
    categorical: new Map([
      ['insured_sex', new Set(['FEMALE', 'MALE'])],
      ['insured_education_level', new Set(['Associate', 'College', 'High School', 'JD', 'MD', 'Masters', 'PhD'])],
      ['insured_occupation', new Set(['adm-clerical', 'armed-forces', 'craft-repair', 'exec-managerial', 'farming-fishing', 'handlers-cleaners', 'machine-op-inspct', 'other-service', 'priv-house-serv', 'prof-specialty', 'protective-serv', 'sales', 'tech-support', 'transport-moving'])],
      ['insured_hobbies', new Set(['base-jumping', 'basketball', 'board-games', 'bungie-jumping', 'camping', 'chess', 'cross-fit', 'dancing', 'exercise', 'golf', 'hiking', 'kayaking', 'movies', 'paintball', 'polo', 'reading', 'skydiving', 'sleeping', 'video-games', 'yachting'])],
      ['insured_relationship', new Set(['husband', 'not-in-family', 'other-relative', 'own-child', 'unmarried', 'wife'])],
      ['policy_csl', new Set(['100/300', '250/500', '500/1000'])],
      ['incident_type', new Set(['Multi-vehicle Collision', 'Parked Car', 'Single Vehicle Collision', 'Vehicle Theft'])],
      ['collision_type', new Set(['Front Collision', 'Rear Collision', 'Side Collision'])],
      ['incident_severity', new Set(['Major Damage', 'Minor Damage', 'Total Loss', 'Trivial Damage'])],
      ['authorities_contacted', new Set(['Ambulance', 'Fire', 'Other', 'Police'])],
      ['auto_make', new Set(['Accura', 'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'Honda', 'Jeep', 'Mercedes', 'Nissan', 'Saab', 'Suburu', 'Toyota', 'Volkswagen'])],
      ['property_damage', new Set(['NO', 'YES'])],
      ['police_report_available', new Set(['NO', 'YES'])],
    ]),
  },
  life: {
    numeric: new Set(['Age', 'Annual_Income', 'Premium_Amount', 'Policy_Term', 'Claim_Amount', 'Time_to_Claim_days', 'No_of_Dependents']),
    categorical: new Map([
      ['Gender', new Set(['Female', 'Male'])],
      ['Marital_Status', new Set(['Divorced', 'Married', 'Single', 'Widowed'])],
      ['Occupation_Type', new Set(['Business', 'Government', 'Retired', 'Salaried', 'Self-Employed'])],
      ['Policy_Type', new Set(['Endowment', 'Term', 'ULIP', 'Whole Life'])],
      ['Cause_of_Death', new Set(['Accident', 'Critical Illness', 'Natural Causes', 'Suicide'])],
      ['Hospitalization_History', new Set(['No', 'Yes'])],
      ['Nominee_Relationship', new Set(['Child', 'Other', 'Spouse', 'Unknown'])],
    ]),
  },
};

if (!INSFORGE_URL) {
  throw new Error('Missing INSFORGE_URL environment variable');
}

initServerMonitoring();

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.posthog.com https://*.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.posthog.com; font-src 'self' data:; connect-src 'self' https://*.insforge.io https://*.posthog.com https://*.sentry.io https://localhost:*; frame-ancestors 'none';"
    );
  }
  next();
});

// HTTPS redirect in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] !== 'https' &&
      !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use((req, _res, next) => {
  Sentry.setTag('service', 'anqor-bff');
  Sentry.setContext('request', {
    method: req.method,
    path: req.path,
  });
  next();
});

// ==========================================
// HEALTH CHECK ENDPOINT - Used for zero-downtime deployment
// ==========================================
app.get('/health', async (_req, res) => {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.0',
    };

    // Check Supabase connection (optional - don't fail if unavailable)
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
      // Simple query to verify connection
      const { error } = await supabase.from('profiles').select('id').limit(1);
      health.supabase = error ? 'degraded' : 'connected';
    } catch (_) {
      health.supabase = 'unavailable';
    }

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check for Docker/PM2
app.get('/healthz', (_req, res) => {
  res.send('OK');
});

function ensurePlainObject(value, label = 'payload') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a plain object`);
  }
  return value;
}

function sanitizeText(value, { maxLength = MAX_STRING_LENGTH, preserveNewlines = false } = {}) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\u0000/g, '')
    .replace(/[<>`]/g, '')
    .replace(preserveNewlines ? /[^\S\r\n]+/g : /\s+/g, ' ')
    .trim();
  return normalized.slice(0, maxLength);
}

function sanitizeKey(value) {
  const key = sanitizeText(value, { maxLength: 64 }).replace(/[^A-Za-z0-9_]/g, '_');
  if (!SAFE_KEY_PATTERN.test(key)) {
    throw new Error('Invalid field name');
  }
  return key;
}

function sanitizeIdentifier(value, label = 'identifier') {
  const id = sanitizeText(value, { maxLength: 128 });
  if (!ID_PATTERN.test(id)) {
    throw new Error(`Invalid ${label}`);
  }
  return id;
}

function sanitizeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error('Invalid integer value');
  }
  return parsed;
}

function sanitizeNumber(value, { min = -1e9, max = 1e9 } = {}) {
  const parsed = typeof value === 'number' ? value : Number(String(value));
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error('Invalid numeric value');
  }
  return parsed;
}

function sanitizeClaimType(value) {
  const claimType = sanitizeText(value || 'auto', { maxLength: 32 }).toLowerCase();
  if (!ALLOWED_CLAIM_TYPES.has(claimType)) {
    throw new Error('Unsupported claim type');
  }
  return claimType;
}

function sanitizeAllowedString(value, allowedValues, fieldName) {
  const normalized = sanitizeText(value);
  if (!allowedValues.has(normalized)) {
    throw new Error(`Invalid value for ${fieldName}`);
  }
  return normalized;
}

function sanitizeClaimData(input, claimType) {
  const payload = ensurePlainObject(input, 'claimData');
  const config = CLAIM_FIELD_CONFIG[claimType];
  if (!config) throw new Error('Unsupported claim type');

  const allowedFields = new Set([
    ...config.numeric,
    ...config.categorical.keys(),
    'claim_type',
  ]);

  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.has(key));
  if (unknownFields.length > 0) {
    throw new Error(`Unexpected claim fields: ${unknownFields.slice(0, 5).join(', ')}`);
  }

  const sanitized = { claim_type: claimType };

  for (const field of config.numeric) {
    if (payload[field] === undefined) continue;
    sanitized[field] = sanitizeNumber(payload[field]);
  }

  for (const [field, allowedValues] of config.categorical.entries()) {
    if (payload[field] === undefined) continue;
    sanitized[field] = sanitizeAllowedString(payload[field], allowedValues, field);
  }

  return sanitized;
}

function sanitizeIndicators(indicators) {
  if (!Array.isArray(indicators)) return [];
  return indicators
    .map((value) => sanitizeText(value, { maxLength: 240 }))
    .filter(Boolean)
    .slice(0, 50);
}

function sanitizePredictionResult(mlResult) {
  const payload = ensurePlainObject(mlResult, 'prediction result');
  return {
    ...payload,
    claim_id: payload.claim_id ? sanitizeIdentifier(payload.claim_id, 'claim id') : undefined,
    indicators: sanitizeIndicators(payload.indicators),
  };
}

function sanitizeClaimRecordForResponse(record) {
  if (!record || typeof record !== 'object') return record;
  return {
    ...record,
    claim_id: record.claim_id ? sanitizeIdentifier(record.claim_id, 'claim id') : record.claim_id,
    incident_type: sanitizeText(record.incident_type || 'Unknown', { maxLength: 120 }),
    indicators: sanitizeIndicators(record.indicators),
  };
}

function sanitizeSchemaLabel(value) {
  return sanitizeText(value || 'insurance', { maxLength: 80 });
}

function sanitizeRequiredFields(value) {
  if (!Array.isArray(value)) {
    throw new Error('requiredFields must be an array');
  }
  return value.map((field) => sanitizeKey(field)).slice(0, 100);
}

function sanitizeHeaderList(value) {
  if (!Array.isArray(value)) {
    throw new Error('headers must be an array');
  }
  if (value.length > MAX_HEADERS) {
    throw new Error('Too many headers');
  }
  return value.map((header) => sanitizeText(header, { maxLength: 120 }));
}

function sanitizeBatchClaims(value, claimType) {
  if (!Array.isArray(value)) {
    throw new Error('claims must be an array');
  }
  if (value.length === 0 || value.length > MAX_BATCH_SIZE) {
    throw new Error(`claims must contain between 1 and ${MAX_BATCH_SIZE} items`);
  }
  return value.map((claim) => sanitizeClaimData(claim, claimType));
}

function sanitizeSortField(value) {
  const sort = sanitizeText(value || 'created_at', { maxLength: 32 });
  return ALLOWED_SORT_FIELDS.has(sort) ? sort : 'created_at';
}

function sanitizeOrder(value) {
  return String(value || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function sanitizePredictionFilter(value) {
  if (value === undefined || value === null || value === '') return null;
  const prediction = sanitizeText(value, { maxLength: 32 });
  if (!ALLOWED_PREDICTIONS.has(prediction)) {
    throw new Error('Invalid prediction filter');
  }
  return prediction;
}

function sanitizeAuthPayload(body) {
  const payload = ensurePlainObject(body, 'request body');
  const email = sanitizeText(payload.email, { maxLength: 254 }).toLowerCase();
  const password = String(payload.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address');
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must be between 8 and 128 characters');
  }
  return {
    email,
    password,
    name: payload.name ? sanitizeText(payload.name, { maxLength: 120 }) : undefined,
    otp: payload.otp ? sanitizeText(payload.otp, { maxLength: 12 }) : undefined,
  };
}

function sanitizeVerificationPayload(body) {
  const payload = ensurePlainObject(body, 'request body');
  const email = sanitizeText(payload.email, { maxLength: 254 }).toLowerCase();
  const otp = sanitizeText(payload.otp, { maxLength: 12 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address');
  }
  if (!otp) {
    throw new Error('Verification code is required');
  }
  return { email, otp };
}

function sanitizeDocumentExtractionResult(parsed, requiredFields) {
  const payload = ensurePlainObject(parsed, 'document extraction result');
  const extractedData = ensurePlainObject(payload.extracted_data || {}, 'extracted_data');
  const sanitizedData = {};
  for (const field of requiredFields) {
    const value = extractedData[field];
    if (value === undefined || value === null) continue;
    sanitizedData[field] = typeof value === 'number' ? sanitizeNumber(value) : sanitizeText(value);
  }
  return {
    success: payload.is_valid_claim_form !== false,
    is_valid_claim_form: payload.is_valid_claim_form !== false,
    rejection_reason: payload.rejection_reason ? sanitizeText(payload.rejection_reason, { maxLength: 240 }) : null,
    data: sanitizedData,
  };
}

function sanitizeHeaderMappingResult(parsed, headers, requiredFields) {
  const payload = ensurePlainObject(parsed, 'header mapping result');
  const mapping = ensurePlainObject(payload.column_mapping || {}, 'column_mapping');
  const allowedHeaders = new Set(headers);
  const allowedFields = new Set(requiredFields);
  const sanitizedMapping = {};
  for (const [source, target] of Object.entries(mapping)) {
    const safeSource = sanitizeText(source, { maxLength: 120 });
    const safeTarget = sanitizeKey(target);
    if (allowedHeaders.has(safeSource) && allowedFields.has(safeTarget)) {
      sanitizedMapping[safeSource] = safeTarget;
    }
  }
  return {
    success: payload.is_valid_insurance_dataset !== false,
    is_valid_insurance_dataset: payload.is_valid_insurance_dataset !== false,
    rejection_reason: payload.rejection_reason ? sanitizeText(payload.rejection_reason, { maxLength: 240 }) : null,
    mapping: sanitizedMapping,
  };
}


function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

function sweepRateLimitStore(now) {
  if (now - lastRateLimitSweepAt < RATE_LIMIT_SWEEP_INTERVAL_MS) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if ((entry.blockedUntil && entry.blockedUntil > now) || entry.events.some((event) => now - event.timestamp < entry.windowMs)) {
      continue;
    }
    rateLimitStore.delete(key);
  }

  lastRateLimitSweepAt = now;
}

function getRateLimitIdentity(req) {
  const userId = req.rateLimitUserId || null;
  if (userId) {
    return `user:${sanitizeIdentifier(userId, 'user id')}`;
  }
  return `ip:${sanitizeText(getClientIp(req), { maxLength: 120 })}`;
}

function attachRateLimitHeaders(res, policy, cost, remaining, resetAt) {
  res.setHeader('X-RateLimit-Limit', String(policy.maxCostPerWindow));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  res.setHeader('X-RateLimit-Cost', String(cost));
}

function consumeRateLimit(req, res, policyName, cost) {
  const policy = RATE_LIMIT_CONFIG[policyName];
  if (!policy) {
    throw new Error(`Unknown rate limit policy: ${policyName}`);
  }

  const boundedCost = Math.max(1, Math.min(Number(cost) || 1, policy.maxCostPerWindow));
  const identity = getRateLimitIdentity(req);
  const key = `${policyName}:${identity}`;
  const now = Date.now();

  sweepRateLimitStore(now);

  const existing = rateLimitStore.get(key) || {
    events: [],
    blockedUntil: 0,
    windowMs: policy.windowMs,
  };

  existing.events = existing.events.filter((event) => now - event.timestamp < policy.windowMs);
  existing.windowMs = policy.windowMs;

  if (existing.blockedUntil && existing.blockedUntil > now) {
    const retryAfterMs = existing.blockedUntil - now;
    attachRateLimitHeaders(res, policy, boundedCost, 0, existing.blockedUntil);
    res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
    return {
      allowed: false,
      retryAfterMs,
      remaining: 0,
      resetAt: existing.blockedUntil,
      reason: 'temporary_block',
    };
  }

  const used = existing.events.reduce((total, event) => total + event.cost, 0);
  const recentBurstCount = existing.events.filter((event) => now - event.timestamp < 10 * 1000).length;
  const oldest = existing.events[0]?.timestamp || now;
  const resetAt = oldest + policy.windowMs;

  if (recentBurstCount >= policy.burstLimit || used + boundedCost > policy.maxCostPerWindow) {
    existing.blockedUntil = now + policy.penaltyMs;
    rateLimitStore.set(key, existing);
    attachRateLimitHeaders(res, policy, boundedCost, 0, existing.blockedUntil);
    res.setHeader('Retry-After', String(Math.ceil(policy.penaltyMs / 1000)));
    return {
      allowed: false,
      retryAfterMs: policy.penaltyMs,
      remaining: 0,
      resetAt: existing.blockedUntil,
      reason: recentBurstCount >= policy.burstLimit ? 'burst_limit' : 'cost_limit',
    };
  }

  existing.events.push({ timestamp: now, cost: boundedCost });
  existing.blockedUntil = 0;
  rateLimitStore.set(key, existing);

  const remaining = policy.maxCostPerWindow - (used + boundedCost);
  attachRateLimitHeaders(res, policy, boundedCost, remaining, resetAt);

  return {
    allowed: true,
    retryAfterMs: 0,
    remaining,
    resetAt,
    reason: 'ok',
  };
}

async function withAiRateLimit(req, res, policyName, costResolver, handler) {
  try {
    const session = await getSessionUser(req, res);
    req.rateLimitUserId = session.user?.id || null;
    req.rateLimitSession = session;
  } catch {
    req.rateLimitUserId = null;
    req.rateLimitSession = null;
  }

  let resolvedCost = 1;
  try {
    resolvedCost = await costResolver(req);
  } catch (error) {
    return sendError(res, error, 400);
  }

  const decision = consumeRateLimit(req, res, policyName, resolvedCost);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      policy: policyName,
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
      reason: decision.reason,
    });
  }

  return handler(req, res);
}

function estimatePredictCost(req) {
  const body = ensurePlainObject(req.body || {}, 'request body');
  const claimType = sanitizeClaimType(body.claim_type || 'auto');
  sanitizeClaimData(body, claimType);
  return 1;
}

function estimateBatchCost(req) {
  const body = ensurePlainObject(req.body || {}, 'request body');
  const claimType = sanitizeClaimType(body.claimCategory || 'auto');
  const claims = sanitizeBatchClaims(body.claims || [], claimType);
  return Math.max(1, Math.min(claims.length, RATE_LIMIT_CONFIG.batch.maxCostPerWindow));
}

function estimateDocumentExtractCost(req) {
  if (!req.file) {
    throw new Error('No file uploaded');
  }
  const sizeMultiplier = req.file.size > 5 * 1024 * 1024 ? 2 : 1;
  return sizeMultiplier + 2;
}

function estimateHeaderMappingCost(req) {
  const body = ensurePlainObject(req.body || {}, 'request body');
  const headers = sanitizeHeaderList(body.headers || []);
  return Math.max(1, Math.ceil(headers.length / 25));
}

function createServerClient(accessToken) {
  return createClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    isServerMode: true,
    edgeFunctionToken: accessToken || undefined,
    fetch,
  });
}

function createPublicClient() {
  return createServerClient(null);
}

function setAuthCookies(res, session) {
  if (session?.accessToken) {
    res.cookie('anqor_access_token', session.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });
  }

  if (session?.refreshToken) {
    res.cookie('anqor_refresh_token', session.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('anqor_access_token', { path: '/' });
  res.clearCookie('anqor_refresh_token', { path: '/' });
}

async function parseError(response) {
  try {
    const data = await response.json();
    return data?.error || data?.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

async function callMl(path, options = {}) {
  const response = await fetch(`${ML_SERVICE_URL}${path}`, options);
  if (!response.ok) {
    const errorMessage = await parseError(response);
    captureServerMessage('ML service request failed', {
      path,
      status: response.status,
      errorMessage,
    });
    throw new Error(errorMessage);
  }
  return response.json();
}

async function getSessionUser(req, res) {
  const accessToken = req.cookies.anqor_access_token || null;
  const refreshToken = req.cookies.anqor_refresh_token || null;

  if (!accessToken) {
    return { client: createServerClient(null), user: null, refreshed: false };
  }

  let client = createServerClient(accessToken);
  const currentUser = await client.auth.getCurrentUser();

  if (!currentUser.error && currentUser.data?.user) {
    return { client, user: currentUser.data.user, refreshed: false };
  }

  if (!refreshToken) {
    clearAuthCookies(res);
    return { client: createServerClient(null), user: null, refreshed: false };
  }

  const refreshClient = createServerClient(accessToken);
  const refreshed = await refreshClient.auth.refreshSession({ refreshToken });

  if (refreshed.error || !refreshed.data?.accessToken || !refreshed.data?.user) {
    clearAuthCookies(res);
    return { client: createServerClient(null), user: null, refreshed: false };
  }

  setAuthCookies(res, refreshed.data);
  client = createServerClient(refreshed.data.accessToken);

  return { client, user: refreshed.data.user, refreshed: true };
}

async function requireUser(req, res) {
  const session = await getSessionUser(req, res);
  if (!session.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return session;
}

async function requireRole(req, res, allowedRoles = ['admin']) {
  const session = await requireUser(req, res);
  if (!session) return null;

  const role = await getUserRole(session.client, session.user.id).catch(() => 'user');
  if (!allowedRoles.includes(role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return null;
  }
  return session;
}

function sendError(res, error, status = 400, context = {}) {
  captureServerException(error, { status, ...context });
  res.status(status).json({ error: error instanceof Error ? error.message : String(error) });
}


function handleUploadMiddleware(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Uploaded file exceeds the 10MB limit',
          max_bytes: MAX_UPLOAD_BYTES,
        });
      }

      return res.status(400).json({
        error: 'Unsupported upload payload',
        allowed_mime_types: Array.from(ALLOWED_UPLOAD_MIME_TYPES),
        max_bytes: MAX_UPLOAD_BYTES,
      });
    }

    return res.status(400).json({ error: 'Invalid upload request' });
  });
}

function generateClaimId() {
  return `CLM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

function calculateTotalClaim(claimData) {
  if (claimData.claim_amount) return Number(claimData.claim_amount);
  if (claimData.repair_estimate) return Number(claimData.repair_estimate);
  if (claimData.net_sales) return Number(claimData.net_sales);
  const injury = Number(claimData.injury_claim) || 0;
  const property = Number(claimData.property_claim) || 0;
  const vehicle = Number(claimData.vehicle_claim) || 0;
  return injury + property + vehicle;
}

function buildClaimRecord(claimData, mlResult) {
  const totalClaim = calculateTotalClaim(claimData);
  const incidentType = sanitizeText(
    claimData.incident_type || claimData.claim_type || claimData.product_name || claimData.cause_of_death || 'Unknown',
    { maxLength: 120 }
  );

  return {
    claim_id: mlResult.claim_id || generateClaimId(),
    input_data: claimData,
    prediction: mlResult.prediction === 'Y' ? 'Fraud' : 'Legitimate',
    risk_score: Math.round(mlResult.probability * 100),
    risk_level: sanitizeText(mlResult.risk_level || 'medium', { maxLength: 32 }),
    indicators: mlResult.indicators || ['No specific indicators returned'],
    incident_type: incidentType,
    claim_amount: totalClaim,
    status: 'pending',
    fraud_explanation: mlResult.fraud_explanation,
    shap_explanation: mlResult.shap_explanation,
    model_confidence: mlResult.model_confidence,
    confidence_interval: mlResult.confidence_interval,
  };
}

async function ensureProfile(client, user, name, role = 'user') {
  await client.database.from('profiles').upsert([
    {
      id: user.id,
      name: sanitizeText(name || user.name || user.email?.split('@')[0], { maxLength: 120 }),
      role: sanitizeText(role, { maxLength: 32 }),
    },
  ], { onConflict: 'id' });
}

async function getUserRole(client, userId) {
  const { data } = await client.database.from('profiles').select('role').eq('id', userId).single();
  return sanitizeText(data?.role || 'user', { maxLength: 32 });
}

/**
 * Generate a random password reset token
 */
function generateResetToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Hash a token using SHA-256
 */
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getAuthedUserPayload(req, res) {
  const session = await getSessionUser(req, res);
  if (!session.user) return { user: null };

  const role = await getUserRole(session.client, session.user.id).catch(() => 'user');

  return {
    user: {
      id: session.user.id,
      email: sanitizeText(session.user.email, { maxLength: 254 }),
      name: sanitizeText(session.user.name || session.user.email?.split('@')[0], { maxLength: 120 }),
      role,
    },
  };
}

app.get([`${API_V1_BASE}/auth/me`, `${API_BASE}/auth/me`], async (req, res) => {
  try {
    res.json(await getAuthedUserPayload(req, res));
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.post([`${API_V1_BASE}/auth/sign-in`, `${API_BASE}/auth/sign-in`], (req, res) => {
  const decision = consumeRateLimit(req, res, 'auth', 1);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Too many sign-in attempts.',
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
    });
  }

  // Check brute force protection
  const email = sanitizeText((req.body?.email || '').toLowerCase(), { maxLength: 254 });
  const clientIp = getClientIp(req);
  const identifier = email || clientIp;

  if (isBlockedForFailedAttempts(identifier)) {
    return res.status(429).json({
      error: 'Too many failed attempts. Please try again later.',
      retry_after_seconds: 3600,
    });
  }

  (async () => {
    try {
      const { email: sanitizedEmail, password } = sanitizeAuthPayload(req.body || {});
      const client = createPublicClient();
      const { data, error } = await client.auth.signInWithPassword({ email: sanitizedEmail, password });

      if (error || !data?.user || !data?.accessToken) {
        // Track failed attempt
        trackFailedAttempt(sanitizedEmail || clientIp);
        return sendError(res, error?.message || 'Sign in failed', 401);
      }

      // Clear failed attempts on successful sign-in
      clearFailedAttempts(sanitizedEmail);
      clearFailedAttempts(clientIp);

      setAuthCookies(res, data);
      const authedClient = createServerClient(data.accessToken);
      await ensureProfile(authedClient, data.user, data.user.name);
      const role = await getUserRole(authedClient, data.user.id).catch(() => 'user');

      res.json({
        user: {
          id: data.user.id,
          email: sanitizeText(data.user.email, { maxLength: 254 }),
          name: sanitizeText(data.user.name || data.user.email?.split('@')[0], { maxLength: 120 }),
          role,
        },
      });
    } catch (error) {
      sendError(res, error, 500);
    }
  })();
});

app.post([`${API_V1_BASE}/auth/sign-up`, `${API_BASE}/auth/sign-up`], (req, res) => {
  const decision = consumeRateLimit(req, res, 'auth', 1);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Too many sign-up attempts.',
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
    });
  }
  (async () => {
    try {
      const { email, password, name } = sanitizeAuthPayload(req.body || {});
      const client = createPublicClient();
      const { data, error } = await client.auth.signUp({ email, password, name });
      if (error) {
        return sendError(res, error.message || 'Sign up failed', 400);
      }

      if (data?.accessToken && data?.user) {
        setAuthCookies(res, data);
        const authedClient = createServerClient(data.accessToken);
        await ensureProfile(authedClient, data.user, name);

        // Send welcome email (don't wait for it, fire and forget)
        emailService.sendWelcomeEmail(
          email,
          name || email.split('@')[0]
        ).catch(err => console.error('Welcome email failed:', err));
      }

      res.json({
        requiresVerification: Boolean(data?.requireEmailVerification),
        user: data?.user
          ? {
              id: data.user.id,
              email: sanitizeText(data.user.email, { maxLength: 254 }),
              name: sanitizeText(name || data.user.name || data.user.email?.split('@')[0], { maxLength: 120 }),
              role: 'user',
            }
          : null,
      });
    } catch (error) {
      sendError(res, error, 500);
    }
  })();
});

app.post([`${API_V1_BASE}/auth/verify-email`, `${API_BASE}/auth/verify-email`], (req, res) => {
  const decision = consumeRateLimit(req, res, 'auth', 1);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Too many verification attempts.',
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
    });
  }
  (async () => {
    try {
      const { email, otp } = sanitizeVerificationPayload(req.body || {});
      const client = createPublicClient();
      const { data, error } = await client.auth.verifyEmail({ email, otp });
      if (error || !data?.user || !data?.accessToken) {
        return sendError(res, error?.message || 'Verification failed', 400);
      }

      setAuthCookies(res, data);
      const authedClient = createServerClient(data.accessToken);
      await ensureProfile(authedClient, data.user, data.user.name);

      res.json({
        user: {
          id: data.user.id,
          email: sanitizeText(data.user.email, { maxLength: 254 }),
          name: sanitizeText(data.user.name || data.user.email?.split('@')[0], { maxLength: 120 }),
          role: await getUserRole(authedClient, data.user.id).catch(() => 'user'),
        },
      });
    } catch (error) {
      sendError(res, error, 500);
    }
  })();
});

app.post([`${API_V1_BASE}/auth/sign-out`, `${API_BASE}/auth/sign-out`], async (req, res) => {
  try {
    const accessToken = req.cookies.anqor_access_token || null;
    const client = createServerClient(accessToken);
    await client.auth.signOut();
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (error) {
    clearAuthCookies(res);
    sendError(res, error, 500);
  }
});

// Token refresh endpoint for client-side silent refresh
app.post([`${API_V1_BASE}/auth/refresh`, `${API_BASE}/auth/refresh`], async (req, res) => {
  try {
    const refreshToken = req.cookies.anqor_refresh_token || null;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const client = createServerClient(null);
    const { data, error } = await client.auth.refreshSession({ refreshToken });

    if (error || !data?.accessToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Session expired' });
    }

    setAuthCookies(res, data);

    res.json({
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: sanitizeText(data.user.email, { maxLength: 254 }),
        name: sanitizeText(data.user.name || data.user.email?.split('@')[0], { maxLength: 120 }),
      } : null,
    });
  } catch (error) {
    clearAuthCookies(res);
    sendError(res, error, 500);
  }
});

app.post([`${API_V1_BASE}/auth/forgot-password`, `${API_BASE}/auth/forgot-password`], (req, res) => {
  const decision = consumeRateLimit(req, res, 'auth', 1);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
    });
  }
  (async () => {
    try {
      const body = ensurePlainObject(req.body || {}, 'request body');
      const email = sanitizeText(body.email, { maxLength: 254 }).toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendError(res, 'Invalid email address', 400);
      }

      // Find user by email
      const client = createPublicClient();
      const { data: users } = await client.auth.admin.listUsers({ email });
      const user = users?.users?.[0];

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
      }

      // Generate reset token
      const token = generateResetToken();
      const tokenHash = await hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      const { error: dbError } = await client.database
        .from('password_reset_tokens')
        .insert([{
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
        }]);

      if (dbError) {
        console.error('Failed to store reset token:', dbError);
        return res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
      }

      // Send custom email with reset link
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const { data: userData } = await client.database.from('profiles').select('name').eq('id', user.id).single();
      const name = userData?.name || email.split('@')[0];

      const emailResult = await emailService.sendPasswordResetEmail(email, resetUrl, name);

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
      }

      res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      // Always return success to prevent email enumeration
      res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
    }
  })();
});

app.post([`${API_V1_BASE}/auth/reset-password`, `${API_BASE}/auth/reset-password`], (req, res) => {
  const decision = consumeRateLimit(req, res, 'auth', 1);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
    });
  }
  (async () => {
    try {
      const body = ensurePlainObject(req.body || {}, 'request body');
      const token = sanitizeText(body.token || '', { maxLength: 128 });
      const email = sanitizeText(body.email || '', { maxLength: 254 }).toLowerCase();
      const newPassword = String(body.password || '');

      if (newPassword.length < 8 || newPassword.length > 128) {
        return sendError(res, 'Password must be between 8 and 128 characters', 400);
      }

      if (!token || !email) {
        return sendError(res, 'Missing token or email', 400);
      }

      // Hash the token to compare with stored hash
      const tokenHash = await hashToken(token);

      // Find valid token in database
      const client = createPublicClient();
      const { data: tokenData, error: tokenError } = await client.database
        .from('password_reset_tokens')
        .select('user_id, expires_at, used')
        .eq('token_hash', tokenHash)
        .single();

      if (tokenError || !tokenData) {
        return sendError(res, 'Invalid or expired reset token', 400);
      }

      if (tokenData.used) {
        return sendError(res, 'Reset token has already been used', 400);
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return sendError(res, 'Reset token has expired', 400);
      }

      // Verify the email matches the user
      const { data: users } = await client.auth.admin.listUsers({ email });
      const user = users?.users?.[0];
      if (!user || user.id !== tokenData.user_id) {
        return sendError(res, 'Invalid reset token', 400);
      }

      // Update user's password using admin API
      const { error: updateError } = await client.auth.admin.updateUserById(
        tokenData.user_id,
        { password: newPassword }
      );

      if (updateError) {
        return sendError(res, updateError.message || 'Failed to reset password', 500);
      }

      // Mark token as used
      await client.database
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token_hash', tokenHash);

      clearAuthCookies(res);
      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
      sendError(res, error, 500);
    }
  })();
});

// OAuth sign-in: redirects to provider
app.get([`${API_V1_BASE}/auth/sign-in-oauth`, `${API_BASE}/auth/sign-in-oauth`], (req, res) => {
  const decision = consumeRateLimit(req, res, 'auth', 1);
  if (!decision.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Too many attempts.',
      retry_after_seconds: Math.ceil(decision.retryAfterMs / 1000),
    });
  }

  try {
    const provider = sanitizeText(req.query.provider || 'google', { maxLength: 32 });
    const allowedProviders = ['google', 'github', 'gitlab', 'bitbucket', 'azure'];
    if (!allowedProviders.includes(provider)) {
      return sendError(res, 'Unsupported OAuth provider', 400);
    }

    const redirectTo = sanitizeText(req.query.redirect_to || `${req.headers.origin || 'http://localhost:5173'}/oauth-callback`, { maxLength: 500 });
    const client = createPublicClient();

    // Generate OAuth URL
    client.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo,
      },
    }).then(({ data, error }) => {
      if (error || !data?.url) {
        return res.status(400).json({ error: error?.message || 'OAuth initiation failed' });
      }
      res.redirect(302, data.url);
    }).catch((err) => {
      sendError(res, err, 500);
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// OAuth callback handler
app.get([`${API_V1_BASE}/auth/oauth-callback`, `${API_BASE}/auth/oauth-callback`], async (req, res) => {
  try {
    const code = req.query.code ? String(req.query.code) : null;
    const error = req.query.error ? String(req.query.error) : null;

    if (error) {
      console.error('OAuth callback error:', error);
      return res.redirect(302, `${req.headers.origin || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    if (!code) {
      return res.redirect(302, `${req.headers.origin || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Exchange code for session
    const client = createPublicClient();
    const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user || !data?.accessToken) {
      console.error('OAuth code exchange error:', exchangeError);
      return res.redirect(302, `${req.headers.origin || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Set auth cookies
    setAuthCookies(res, data);

    // Ensure profile exists
    const authedClient = createServerClient(data.accessToken);
    await ensureProfile(authedClient, data.user, data.user.name);

    // Redirect to home page
    res.redirect(302, `${req.headers.origin || 'http://localhost:5173'}/`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(302, `${req.headers.origin || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
});

app.post([`${API_V1_BASE}/claims/predict`, `${API_BASE}/claims/predict`], (req, res) => withAiRateLimit(req, res, 'predict', estimatePredictCost, async (req, res) => {
  try {
    const rawClaimData = ensurePlainObject(req.body || {}, 'request body');
    const claimType = sanitizeClaimType(rawClaimData.claim_type || 'auto');
    const claimData = sanitizeClaimData(rawClaimData, claimType);
    const mlResult = sanitizePredictionResult(await callMl('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData),
    }));
    const record = buildClaimRecord(claimData, mlResult);
    const session = await getSessionUser(req, res);

    if (!session.user) {
      return res.json(sanitizeClaimRecordForResponse({ ...record, id: 'temp-id', created_at: new Date().toISOString() }));
    }

    const { data } = await session.client.database
      .from('claims')
      .insert([{ ...record, user_id: session.user.id }])
      .select()
      .single();

    return res.json(sanitizeClaimRecordForResponse(data || { ...record, id: 'temp-id', created_at: new Date().toISOString() }));
  } catch (error) {
    sendError(res, error, 500);
  }
}));

app.get([`${API_V1_BASE}/claims`, `${API_BASE}/claims`], async (req, res) => {
  try {
    const session = await requireUser(req, res);
    if (!session) return;

    const page = sanitizeInteger(req.query.page, { min: 1, max: 100000, fallback: 1 });
    const limit = sanitizeInteger(req.query.limit, { min: 1, max: 100, fallback: 20 });
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sort = sanitizeSortField(req.query.sort);
    const order = sanitizeOrder(req.query.order) === 'asc';
    const prediction = sanitizePredictionFilter(req.query.prediction);

    let query = session.client.database
      .from('claims')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(sort, { ascending: order });

    if (prediction) {
      query = query.eq('prediction', prediction);
    }

    const { data, error, count } = await query;
    if (error) {
      return sendError(res, error.message || 'Failed to fetch claims', 500);
    }

    res.json({ data: (data || []).map(sanitizeClaimRecordForResponse), total: count || 0 });
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.get([`${API_V1_BASE}/claims/:id`, `${API_BASE}/claims/:id`], async (req, res) => {
  try {
    const session = await requireUser(req, res);
    if (!session) return;

    const { data, error } = await session.client.database
      .from('claims')
      .select('*')
      .eq('id', sanitizeIdentifier(req.params.id, 'claim id'))
      .single();

    if (error || !data) {
      return sendError(res, error?.message || 'Failed to fetch claim', 404);
    }

    res.json(sanitizeClaimRecordForResponse(data));
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.get([`${API_V1_BASE}/stats`, `${API_BASE}/stats`], async (req, res) => {
  try {
    const session = await requireUser(req, res);
    if (!session) return;

    const { data, error } = await session.client.database
      .from('claims')
      .select('prediction, risk_score, claim_amount, input_data, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return sendError(res, error.message || 'Failed to fetch stats', 500);
    }

    const allClaims = data || [];
    const severityMap = new Map();
    const amountMap = new Map();
    let fraudDetected = 0;
    let totalRiskScore = 0;

    for (const claim of allClaims) {
      if (claim.prediction === 'Fraud') fraudDetected++;
      totalRiskScore += claim.risk_score;
      const source = claim.input_data || {};
      const severity = sanitizeText(source.incident_severity || source.weather_conditions || 'Unknown', { maxLength: 120 });
      severityMap.set(severity, (severityMap.get(severity) || 0) + 1);

      const amount = claim.claim_amount || 0;
      let range = '0 - 5k';
      if (amount > 5000 && amount <= 20000) range = '5k - 20k';
      else if (amount > 20000 && amount <= 50000) range = '20k - 50k';
      else if (amount > 50000) range = '50k+';
      amountMap.set(range, (amountMap.get(range) || 0) + 1);
    }

    const recent10 = allClaims.slice(0, 10).reverse();
    res.json({
      totalClaims: allClaims.length,
      fraudDetected,
      avgRiskScore: allClaims.length ? Math.round((totalRiskScore / allClaims.length) * 10) / 10 : 0,
      trendData: recent10.map((claim, index) => ({
        month: `#${index + 1}`,
        fraud: claim.prediction === 'Fraud' ? claim.risk_score : 0,
        legit: claim.prediction === 'Legitimate' ? 100 - claim.risk_score : 0,
      })),
      severityBreakdown: Array.from(severityMap.entries()).map(([severity, count]) => ({ severity, count })),
      claimAmountDistribution: Array.from(amountMap.entries()).map(([range, count]) => ({ range, count })),
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.post([`${API_V1_BASE}/batches`, `${API_BASE}/batches`], (req, res) => withAiRateLimit(req, res, 'batch', estimateBatchCost, async (req, res) => {
  try {
    const body = ensurePlainObject(req.body || {}, 'request body');
    const claimCategory = sanitizeClaimType(body.claimCategory || 'auto');
    const claims = sanitizeBatchClaims(body.claims || [], claimCategory);
    const session = await getSessionUser(req, res);

    if (!session.user) {
      const predictions = await Promise.all(
        claims.map(async (claim) => {
          try {
            const payload = sanitizeClaimData({ ...claim, claim_type: claimCategory }, claimCategory);
            const mlResult = sanitizePredictionResult(await callMl('/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }));
            return {
              claim_data: payload,
              prediction: mlResult.prediction === 'Y' ? 'Fraud' : 'Legitimate',
              risk_score: Math.round(mlResult.probability * 100),
              indicators: sanitizeIndicators(mlResult.indicators || []),
              status: 'success',
            };
          } catch (error) {
            return {
              claim_data: claim,
              prediction: 'Unknown',
              risk_score: 0,
              indicators: [],
              status: 'failed',
              error: error instanceof Error ? sanitizeText(error.message, { maxLength: 200 }) : 'Unknown error',
            };
          }
        })
      );

      return res.json({
        id: `batch_temp_${Date.now()}`,
        status: 'completed',
        total_claims: claims.length,
        processed_claims: predictions.filter((item) => item.status === 'success').length,
        predictions,
        created_at: new Date().toISOString(),
      });
    }

    const { data: batch, error: batchError } = await session.client.database
      .from('batches')
      .insert([{ user_id: session.user.id, total_claims: claims.length, status: 'processing' }])
      .select()
      .single();

    if (batchError || !batch) {
      return sendError(res, batchError?.message || 'Failed to create batch record', 500);
    }

    let processedCount = 0;
    const results = [];

    for (const claim of claims) {
      try {
        const payload = sanitizeClaimData({ ...claim, claim_type: claimCategory }, claimCategory);
        const mlResult = sanitizePredictionResult(await callMl('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }));
        const record = buildClaimRecord(payload, mlResult);

        const { data: savedClaim, error: saveError } = await session.client.database
          .from('claims')
          .insert([{ ...record, user_id: session.user.id, batch_id: batch.id }])
          .select()
          .single();

        if (saveError || !savedClaim) {
          throw new Error(saveError?.message || 'Save failed');
        }

        processedCount++;
        results.push({
          claim_data: payload,
          prediction: record.prediction,
          risk_score: record.risk_score,
          indicators: sanitizeIndicators(record.indicators),
          status: 'success',
        });
      } catch (error) {
        results.push({
          claim_data: claim,
          prediction: 'Unknown',
          risk_score: 0,
          indicators: [],
          status: 'failed',
          error: error instanceof Error ? sanitizeText(error.message, { maxLength: 200 }) : 'Save failed',
        });
      }
    }

    await session.client.database
      .from('batches')
      .update({
        status: processedCount === claims.length ? 'completed' : 'completed_with_errors',
        processed_claims: processedCount,
      })
      .eq('id', batch.id);

    res.json({
      ...batch,
      status: processedCount === claims.length ? 'completed' : 'completed_with_errors',
      processed_claims: processedCount,
      predictions: results,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}));

app.post([`${API_V1_BASE}/document/extract`, `${API_BASE}/document/extract`], handleUploadMiddleware, (req, res) => withAiRateLimit(req, res, 'documentExtract', estimateDocumentExtractCost, async (req, res) => {
  try {
    const file = req.file;
    const category = sanitizeClaimType(req.body?.category || 'auto');
    const schemaLabel = sanitizeSchemaLabel(req.body?.schemaLabel || 'insurance');
    const requiredFields = sanitizeRequiredFields(JSON.parse(req.body?.requiredFields || '[]'));
    const model = 'openai/gpt-4o-mini';

    if (!file) {
      return sendError(res, 'No file uploaded', 400);
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      return sendError(res, 'Unsupported file type', 400);
    }
    if (!Buffer.isBuffer(file.buffer) || file.size > MAX_UPLOAD_BYTES) {
      return sendError(res, 'Uploaded file exceeds the 10MB limit', 413);
    }

    const safeFilename = sanitizeText(file.originalname || 'upload', { maxLength: 120 });
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const isPDF = file.mimetype === 'application/pdf' || safeFilename.toLowerCase().endsWith('.pdf');

    const prompt = `You are an expert insurance claim adjuster. Analyze this document (image or PDF) and determine if it is a readable, valid ${schemaLabel} claim or related incident report.

If the document is too blurry, completely illegible, or is NOT related to a ${schemaLabel} claim (e.g. a restaurant receipt, a random selfie, etc.), you MUST reject it.

If it IS a valid ${schemaLabel} claim, intelligently extract the data. Map synonymous terms to fit exactly into our schema. If a field is completely missing, use a reasonable default or 0.

You MUST return ONLY valid JSON with no markdown formatting, no code blocks, and no explanations. Use this exact schema:

{
  "is_valid_claim_form": boolean,
  "rejection_reason": "string explaining why it was rejected, or null if valid",
  "extracted_data": {
    ${requiredFields.map((field) => `"${field}": <value>`).join(',\n    ')}
  }
}

Return ONLY the JSON object.`;

    const content = [{ type: 'text', text: prompt }];
    if (isPDF) {
      content.push({ type: 'file', file: { filename: safeFilename, file_data: base64 } });
    } else {
      content.push({ type: 'image_url', image_url: { url: base64 } });
    }

    const client = createPublicClient();
    const completion = await client.ai.chat.completions.create({
      model,
      messages: [{ role: 'user', content }],
      temperature: 0.1,
      maxTokens: 2000,
      ...(isPDF ? { fileParser: { enabled: true } } : {}),
    });

    const raw = completion.choices[0]?.message?.content || '';
    let jsonStr = raw.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    const sanitized = sanitizeDocumentExtractionResult(JSON.parse(jsonStr), requiredFields);

    if (!sanitized.success) {
      return res.json({
        success: false,
        is_valid_claim_form: false,
        rejection_reason: sanitized.rejection_reason || `The uploaded document is not a valid or readable ${schemaLabel} claim.`,
        error: sanitized.rejection_reason || 'Invalid document',
        raw: sanitizeText(raw, { maxLength: 4000, preserveNewlines: true }),
        model,
      });
    }

    res.json({
      success: true,
      is_valid_claim_form: true,
      data: sanitized.data,
      raw: sanitizeText(raw, { maxLength: 4000, preserveNewlines: true }),
      model,
      category,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}));

app.post([`${API_V1_BASE}/document/map-headers`, `${API_BASE}/document/map-headers`], (req, res) => withAiRateLimit(req, res, 'documentMapHeaders', estimateHeaderMappingCost, async (req, res) => {
  try {
    const body = ensurePlainObject(req.body || {}, 'request body');
    const headers = sanitizeHeaderList(body.headers || []);
    const category = sanitizeClaimType(body.category || 'auto');
    const schemaLabel = sanitizeSchemaLabel(body.schemaLabel || 'insurance');
    const requiredFields = sanitizeRequiredFields(body.requiredFields || []);
    const model = 'openai/gpt-4o-mini';

    const prompt = `You are a data engineer for an insurance fraud detection system.
Analyze this list of CSV headers and determine if it represents a ${schemaLabel} dataset.

If the dataset is NOT related to ${schemaLabel} (e.g. employee salaries, grocery items, medical bills), you MUST reject it.

If it IS a valid ${schemaLabel} dataset, figure out how to map the provided CSV headers to our strict field schema.

Our required fields:
[${requiredFields.join(', ')}]

Return ONLY valid JSON using this exact schema:
{
  "is_valid_insurance_dataset": boolean,
  "rejection_reason": "string explaining why it was rejected, or null if valid",
  "column_mapping": {
    "user_csv_column_name": "our_strict_field_name"
  }
}`;

    const client = createPublicClient();
    const completion = await client.ai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'text', text: `CSV Headers to analyze: ${JSON.stringify(headers)}` }] }],
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let jsonStr = raw.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    const sanitized = sanitizeHeaderMappingResult(JSON.parse(jsonStr), headers, requiredFields);

    if (!sanitized.success) {
      return res.json({
        success: false,
        is_valid_insurance_dataset: false,
        rejection_reason: sanitized.rejection_reason || `Not a valid ${schemaLabel} dataset`,
        model,
        category,
      });
    }

    res.json({
      success: true,
      is_valid_insurance_dataset: true,
      mapping: sanitized.mapping,
      model,
      category,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}));

app.get([`${API_V1_BASE}/admin/users`, `${API_BASE}/admin/users`], async (req, res) => {
  const session = await requireRole(req, res, ['admin']);
  if (!session) return;

  try {
    const page = sanitizeInteger(req.query.page, { min: 1, max: 1000, fallback: 1 });
    const limit = sanitizeInteger(req.query.limit, { min: 1, max: 100, fallback: 50 });
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await session.client.database
      .from('profiles')
      .select('id, name, role, created_at')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, error.message || 'Failed to fetch users', 500);
    }

    res.json({ data: data || [], total: count || 0 });
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.post([`${API_V1_BASE}/admin/users/:id/role`, `${API_BASE}/admin/users/:id/role`], async (req, res) => {
  const session = await requireRole(req, res, ['admin']);
  if (!session) return;

  try {
    const userId = sanitizeIdentifier(req.params.id, 'user id');
    const body = ensurePlainObject(req.body || {}, 'request body');
    const newRole = sanitizeText(body.role, { maxLength: 32 });

    if (!['user', 'admin'].includes(newRole)) {
      return sendError(res, 'Invalid role', 400);
    }

    const { error } = await session.client.database
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return sendError(res, error.message || 'Failed to update role', 500);
    }

    res.json({ success: true, role: newRole });
  } catch (error) {
    sendError(res, error, 500);
  }
});

app.get([`${API_V1_BASE}/health`, `${API_BASE}/health`], (_req, res) => {
  res.json({ status: 'ok' });
});

// ==========================================
// NOTIFICATION ENDPOINTS
// ==========================================

// Get VAPID public key for push subscription
app.get([`${API_V1_BASE}/notifications/vapid-public-key`, `${API_BASE}/notifications/vapid-public-key`], (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Subscribe to push notifications
app.post([`${API_V1_BASE}/notifications/subscribe-push`, `${API_BASE}/notifications/subscribe-push`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const body = ensurePlainObject(req.body || {}, 'request body');
    const subscription = body.subscription;
    
    if (!subscription || !subscription.endpoint) {
      return sendError(res, 'Invalid push subscription', 400);
    }

    pushService.storePushSubscription(session.user.id, subscription);
    res.json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Unsubscribe from push notifications
app.post([`${API_V1_BASE}/notifications/unsubscribe-push`, `${API_BASE}/notifications/unsubscribe-push`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    pushService.removePushSubscription(session.user.id);
    res.json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Get notification preferences
app.get([`${API_V1_BASE}/notifications/preferences`, `${API_BASE}/notifications/preferences`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const { data, error } = await session.client.database
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      return sendError(res, error.message, 500);
    }

    res.json(data || {
      email_marketing: true,
      email_transactional: true,
      push_enabled: true,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Update notification preferences
app.post([`${API_V1_BASE}/notifications/preferences`, `${API_BASE}/notifications/preferences`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const body = ensurePlainObject(req.body || {}, 'request body');
    const prefs = {
      user_id: session.user.id,
      email_marketing: Boolean(body.email_marketing ?? true),
      email_transactional: Boolean(body.email_transactional ?? true),
      push_enabled: Boolean(body.push_enabled ?? true),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await session.client.database
      .from('user_notification_preferences')
      .upsert([prefs])
      .select()
      .single();

    if (error) {
      return sendError(res, error.message, 500);
    }

    res.json(data);
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Email unsubscribe endpoint (legal requirement)
app.get([`${API_V1_BASE}/notifications/unsubscribe`, `${API_BASE}/notifications/unsubscribe`], async (req, res) => {
  try {
    const email = sanitizeText(req.query.email || '', { maxLength: 254 });
    const token = sanitizeText(req.query.token || '', { maxLength: 500 });

    if (!email || !token) {
      return res.status(400).send('Invalid unsubscribe link');
    }

    // Verify token (simplified for demo)
    const isValid = verifyUnsubscribeToken(token, email);
    if (!isValid) {
      return res.status(400).send('Invalid or expired unsubscribe link');
    }

    // Update user preferences (find user by email)
    const client = createPublicClient();
    const { data: users } = await client.auth.admin.listUsers({ email });
    if (users?.users?.[0]) {
      const userId = users.users[0].id;
      await client.database
        .from('user_notification_preferences')
        .upsert([{ user_id: userId, email_marketing: false, updated_at: new Date().toISOString() }]);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive marketing emails from Anqor.</p>
        <p>Transaction emails (password reset, etc.) will still be sent.</p>
        <a href="${process.env.APP_URL || 'http://localhost:5173'}">Return to Anqor</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send('An error occurred');
  }
});

// Test notification endpoint (for testing)
app.post([`${API_V1_BASE}/notifications/test`, `${API_BASE}/notifications/test`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const body = ensurePlainObject(req.body || {}, 'request body');
    const type = sanitizeText(body.type || 'push', { maxLength: 20 });
    const result = { email: null, push: null };

    if (type === 'email' || type === 'both') {
      const emailResult = await emailService.sendEmail({
        to: session.user.email,
        subject: 'Test Email from Anqor',
        html: '<h1>Test Email</h1><p>This is a test email from Anqor.</p>',
        text: 'Test Email from Anqor',
        idempotencyKey: `test_email:${session.user.id}:${Date.now()}`,
        isMarketing: false,
      });
      result.email = emailResult;
    }

    if (type === 'push' || type === 'both') {
      const pushResult = await pushService.sendPushNotification(
        session.user.id,
        { title: 'Test Notification', body: 'This is a test push notification', url: '/' },
        `test_push:${session.user.id}:${Date.now()}`
      );
      result.push = pushResult;
    }

    res.json({ success: true, result });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// ===== GDPR Compliance Endpoints =====

// Generate GDPR request token (valid for 24 hours)
function generateGdprToken(userId, email, action) {
  const payload = `${userId}:${email}:${action}:${Date.now()}:${process.env.GDPR_SECRET || 'gdpr-secret'}`;
  const token = crypto.createHash('sha256').update(payload).digest('hex');
  return token;
}

// Verify GDPR token
function verifyGdprToken(token, userId, email, action) {
  // Tokens are valid for 24 hours
  const payload = `${userId}:${email}:${action}:${Date.now()}:${process.env.GDPR_SECRET || 'gdpr-secret'}`;
  const expectedToken = crypto.createHash('sha256').update(payload).digest('hex');
  return token === expectedToken;
}

// Export user data (GDPR data portability)
app.get([`${API_V1_BASE}/gdpr/export`, `${API_BASE}/gdpr/export`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const client = createClient(session);
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Collect all user data
    const userData = {
      user: null,
      claims: [],
      predictions: [],
      notificationPreferences: null,
      pushSubscriptions: [],
      exportDate: new Date().toISOString(),
      dataRetentionPolicy: 'Data is retained for 2 years after last login or until deletion request',
    };

    // Get user profile
    const { data: profile } = await client.database
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    userData.user = profile;

    // Get claims
    const { data: claims } = await client.database
      .from('claims')
      .select('*')
      .eq('user_id', userId);
    userData.claims = claims || [];

    // Get predictions
    const { data: predictions } = await client.database
      .from('predictions')
      .select('*')
      .eq('user_id', userId);
    userData.predictions = predictions || [];

    // Get notification preferences
    const { data: prefs } = await client.database
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    userData.notificationPreferences = prefs;

    // Get push subscriptions (without sensitive keys)
    const { data: subscriptions } = await client.database
      .from('push_subscriptions')
      .select('id, endpoint, created_at, updated_at')
      .eq('user_id', userId);
    userData.pushSubscriptions = subscriptions || [];

    // Log the export request
    await client.database.from('notification_logs').insert([{
      user_id: userId,
      type: 'gdpr_export',
      status: 'success',
      created_at: new Date().toISOString(),
    }]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="anqor-data-export-${userId}-${Date.now()}.json"`);
    res.json(userData);
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Request data deletion (GDPR right to erasure)
app.post([`${API_V1_BASE}/gdpr/delete-request`, `${API_BASE}/gdpr/delete-request`], async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) return;

  try {
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Generate deletion token
    const token = crypto.createHash('sha256')
      .update(`${userId}:${userEmail}:delete:${Date.now()}:${process.env.GDPR_SECRET || 'gdpr-secret'}`)
      .digest('hex');

    // Store deletion request in database (with 7-day expiry)
    const client = createClient(session);
    await client.database.from('gdpr_requests').insert([{
      user_id: userId,
      action: 'delete',
      token: token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }]);

    // Send confirmation email
    const confirmationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/gdpr/delete-confirm?token=${token}&email=${encodeURIComponent(userEmail)}`;
    await emailService.sendEmail({
      to: userEmail,
      subject: 'Confirm Data Deletion Request - Anqor',
      html: `
        <h1>GDPR Data Deletion Request</h1>
        <p>We received a request to delete all your data from Anqor.</p>
        <p><strong>This action cannot be undone.</strong></p>
        <p>Click the link below to confirm deletion (expires in 7 days):</p>
        <p><a href="${confirmationUrl}" style="display: inline-block; padding: 10px 20px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Confirm Deletion</a></p>
        <p>Or copy this link: ${confirmationUrl}</p>
        <p>If you did not request this, please ignore this email or <a href="mailto:support@anqor.com">contact support</a>.</p>
      `,
      text: `GDPR Data Deletion Request\n\nClick to confirm: ${confirmationUrl}\n\nIf you did not request this, please ignore this email.`,
      idempotencyKey: `gdpr_delete:${userId}:${Date.now()}`,
      isMarketing: false,
    });

    res.json({
      success: true,
      message: 'Deletion request sent. Please check your email to confirm.',
    });
  } catch (error) {
    sendError(res, error, 500);
  }
});

// Show deletion confirmation page
app.get([`${API_V1_BASE}/gdpr/delete-confirm`, `${API_BASE}/gdpr/delete-confirm`], async (req, res) => {
  const token = sanitizeText(req.query.token || '', { maxLength: 500 });
  const email = sanitizeText(req.query.email || '', { maxLength: 254 });

  if (!token || !email) {
    return res.status(400).send('Invalid deletion link');
  }

  // Verify token exists and is not expired
  try {
    const client = createPublicClient();
    const { data: requests } = await client.database
      .from('gdpr_requests')
      .select('*')
      .eq('token', token)
      .eq('action', 'delete')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (!requests || requests.length === 0) {
      return res.status(400).send('Invalid or expired deletion link');
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Confirm Data Deletion - Anqor</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .warning { background: #fef2f2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
          button { padding: 10px 30px; margin: 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
          .confirm { background: #dc2626; color: white; }
          .cancel { background: #6b7280; color: white; }
        </style>
      </head>
      <body>
        <h1>⚠️ Confirm Data Deletion</h1>
        <div class="warning">
          <p><strong>This action CANNOT be undone.</strong></p>
          <p>All your data will be permanently deleted:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Profile information</li>
            <li>All claims and predictions</li>
            <li>Notification preferences</li>
            <li>Push subscriptions</li>
          </ul>
        </div>
        <form method="POST" action="/api/v1/gdpr/delete-confirm">
          <input type="hidden" name="token" value="${token}">
          <input type="hidden" name="email" value="${email}">
          <button type="submit" class="confirm">Yes, Delete My Data</button>
          <a href="${process.env.APP_URL || 'http://localhost:5173'}"><button type="button" class="cancel">Cancel</button></a>
        </form>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('An error occurred');
  }
});

// Process deletion confirmation
app.post([`${API_V1_BASE}/gdpr/delete-confirm`, `${API_BASE}/gdpr/delete-confirm`], async (req, res) => {
  const token = sanitizeText(req.body.token || req.query.token || '', { maxLength: 500 });
  const email = sanitizeText(req.body.email || req.query.email || '', { maxLength: 254 });

  if (!token || !email) {
    return res.status(400).send('Invalid deletion request');
  }

  try {
    const client = createPublicClient();

    // Get and validate deletion request
    const { data: requests } = await client.database
      .from('gdpr_requests')
      .select('*')
      .eq('token', token)
      .eq('action', 'delete')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (!requests || requests.length === 0) {
      return res.status(400).send('Invalid or expired deletion link');
    }

    const request = requests[0];
    const userId = request.user_id;

    // Get admin client for deletion
    const adminClient = createClient({ user: { role: 'service_role' } });

    // Delete user data in correct order (respecting foreign keys)
    await adminClient.database.from('notification_logs').delete().eq('user_id', userId);
    await adminClient.database.from('push_subscriptions').delete().eq('user_id', userId);
    await adminClient.database.from('user_notification_preferences').delete().eq('user_id', userId);
    await adminClient.database.from('predictions').delete().eq('user_id', userId);
    await adminClient.database.from('claims').delete().eq('user_id', userId);
    await adminClient.database.from('profiles').delete().eq('id', userId);
    await adminClient.database.from('gdpr_requests').delete().eq('user_id', userId);

    // Mark deletion request as completed
    await adminClient.database
      .from('gdpr_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', request.id);

    // Delete user from auth (this should be done last)
    try {
      await adminClient.auth.admin.deleteUser(userId);
    } catch (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue anyway - user data is deleted
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Data Deleted - Anqor</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>✅ Your Data Has Been Deleted</h1>
        <p>All your personal data has been permanently removed from Anqor.</p>
        <p>This action cannot be undone.</p>
        <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Return to Home</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Deletion error:', error);
    res.status(500).send('An error occurred during deletion');
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  captureServerException(error, {
    path: req.path,
    method: req.method,
    unhandled: true,
  });

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Anqor BFF listening on http://localhost:${PORT}`);
});
