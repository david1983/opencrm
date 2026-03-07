import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import ConnectedApp from '../src/models/ConnectedApp.js';
import Organization from '../src/models/Organization.js';
import { hashSecret } from '../src/utils/tokenUtils.js';

describe('OAuth Controller', () => {
  let app;
  let userToken;
  let userId;
  let orgId;
  let clientId;
  let clientSecret;
  let connectedAppId;

  beforeAll(async () => {
    app = createApp;
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await ConnectedApp.deleteMany({});
    await Organization.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    const user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    userToken = res.body.token;

    // Create connected app
    clientId = 'test_client_id';
    clientSecret = 'test_client_secret';
    const connectedApp = await ConnectedApp.create({
      name: 'Test OAuth App',
      organization: orgId,
      authType: 'oauth',
      clientId,
      clientSecretHash: await hashSecret(clientSecret),
      redirectUris: ['http://localhost:3000/callback'],
      scopes: ['accounts:read', 'contacts:read', 'contacts:write'],
      isActive: true,
    });
    connectedAppId = connectedApp._id;
  });

  describe('GET /api/oauth/authorize', () => {
    it('should show authorization page for valid request', async () => {
      const response = await request(app)
        .get('/api/oauth/authorize')
        .query({
          client_id: clientId,
          redirect_uri: 'http://localhost:3000/callback',
          response_type: 'code',
          scope: 'accounts:read contacts:read',
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.app.name).toBe('Test OAuth App');
      expect(response.body.data.scopes).toContain('accounts:read');
    });

    it('should reject invalid client_id', async () => {
      const response = await request(app)
        .get('/api/oauth/authorize')
        .query({
          client_id: 'invalid_client',
          redirect_uri: 'http://localhost:3000/callback',
          response_type: 'code',
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });

    it('should reject invalid redirect_uri', async () => {
      const response = await request(app)
        .get('/api/oauth/authorize')
        .query({
          client_id: clientId,
          redirect_uri: 'http://evil.com/callback',
          response_type: 'code',
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/oauth/authorize/consent', () => {
    it('should create authorization code on allow', async () => {
      const response = await request(app)
        .post('/api/oauth/authorize/consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          client_id: clientId,
          scopes: ['accounts:read', 'contacts:read'],
          allow: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.code).toBeDefined();
    });

    it('should return error on deny', async () => {
      const response = await request(app)
        .post('/api/oauth/authorize/consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          client_id: clientId,
          scopes: ['accounts:read'],
          allow: false,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('denied');
    });
  });

  describe('POST /api/oauth/token', () => {
    it('should exchange code for tokens', async () => {
      // First authorize
      const consentRes = await request(app)
        .post('/api/oauth/authorize/consent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          client_id: clientId,
          scopes: ['accounts:read'],
          allow: true,
        });

      const code = consentRes.body.data.code;

      const response = await request(app)
        .post('/api/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
        });

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(response.body.token_type).toBe('Bearer');
    });

    it('should reject invalid code', async () => {
      const response = await request(app)
        .post('/api/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: 'invalid_code',
          client_id: clientId,
          client_secret: clientSecret,
        });

      expect(response.status).toBe(400);
    });
  });
});