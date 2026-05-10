// Vitest setup file
import { beforeAll, afterAll, vi } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

// Mock crypto for Node.js < 19
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto;
}
