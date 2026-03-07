import {
  generateClientId,
  generateClientSecret,
  hashSecret,
  verifySecret,
  generateApiKey,
  getApiKeyPrefix,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  hashToken,
} from '../src/utils/tokenUtils.js';

describe('Token Utilities', () => {
  describe('OAuth Client Generation', () => {
    it('should generate unique client IDs', () => {
      const id1 = generateClientId();
      const id2 = generateClientId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ca_client_[a-zA-Z0-9]{32}$/);
    });

    it('should generate unique client secrets', () => {
      const secret1 = generateClientSecret();
      const secret2 = generateClientSecret();
      expect(secret1).not.toBe(secret2);
      expect(secret1.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Secret Hashing', () => {
    it('should hash and verify secrets', async () => {
      const secret = generateClientSecret();
      const hash = await hashSecret(secret);

      expect(hash).not.toBe(secret);
      expect(await verifySecret(secret, hash)).toBe(true);
      expect(await verifySecret('wrong_secret', hash)).toBe(false);
    });
  });

  describe('API Key Generation', () => {
    it('should generate API keys with prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^ca_live_[a-zA-Z0-9]{32}$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });

    it('should extract API key prefix', () => {
      const key = generateApiKey();
      const prefix = getApiKeyPrefix(key);
      expect(prefix).toBe(key.substring(0, 12));
    });
  });

  describe('JWT Tokens', () => {
    it('should generate and verify access tokens', () => {
      const payload = { userId: '123', orgId: '456', scopes: ['accounts:read'] };
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe('123');
      expect(decoded.scopes).toContain('accounts:read');
    });

    it('should generate refresh tokens', () => {
      const token = generateRefreshToken();
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Token Hashing', () => {
    it('should hash tokens consistently', () => {
      const token = 'test_token_123';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
      expect(hash1.length).toBe(64); // SHA256 hex output
    });
  });
});