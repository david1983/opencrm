import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1h';

// OAuth Client Generation
export function generateClientId() {
  return `ca_client_${crypto.randomBytes(16).toString('hex')}`;
}

export function generateClientSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Secret Hashing
export async function hashSecret(secret) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(secret, salt);
}

export async function verifySecret(secret, hash) {
  return bcrypt.compare(secret, hash);
}

// API Key Generation
export function generateApiKey() {
  return `ca_live_${crypto.randomBytes(16).toString('hex')}`;
}

export function getApiKeyPrefix(key) {
  return key.substring(0, 12);
}

// JWT Token Generation
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Refresh Token Generation
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}