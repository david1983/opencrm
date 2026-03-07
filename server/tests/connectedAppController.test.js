import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import ConnectedApp from '../src/models/ConnectedApp.js';
import Organization from '../src/models/Organization.js';
import { hashSecret } from '../src/utils/tokenUtils.js';

describe('Connected App Controller', () => {
  let app;
  let adminToken;
  let orgId;

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

    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = res.body.token;
  });

  describe('POST /api/admin/connected-apps (OAuth)', () => {
    it('should create OAuth connected app', async () => {
      const response = await request(app)
        .post('/api/admin/connected-apps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'My OAuth App',
          description: 'Test OAuth app',
          authType: 'oauth',
          redirectUris: ['http://localhost:3000/callback'],
          scopes: ['accounts:read', 'contacts:read'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('My OAuth App');
      expect(response.body.data.authType).toBe('oauth');
      expect(response.body.data.clientId).toBeDefined();
      expect(response.body.data.clientSecret).toBeDefined(); // Only shown once
    });
  });

  describe('POST /api/admin/connected-apps (API Key)', () => {
    it('should create API key connected app', async () => {
      const response = await request(app)
        .post('/api/admin/connected-apps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'My API App',
          description: 'Test API key app',
          authType: 'apikey',
          scopes: ['accounts:read', 'contacts:write'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.authType).toBe('apikey');
      expect(response.body.data.apiKey).toBeDefined(); // Only shown once
    });
  });

  describe('GET /api/admin/connected-apps', () => {
    it('should list connected apps', async () => {
      await ConnectedApp.create({
        name: 'App 1',
        organization: orgId,
        authType: 'oauth',
        clientId: 'client1',
      });

      await ConnectedApp.create({
        name: 'App 2',
        organization: orgId,
        authType: 'apikey',
        apiKeyPrefix: 'ca_live_abc',
      });

      const response = await request(app)
        .get('/api/admin/connected-apps')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /api/admin/connected-apps/:id', () => {
    it('should deactivate connected app', async () => {
      const appDoc = await ConnectedApp.create({
        name: 'Test App',
        organization: orgId,
        authType: 'oauth',
        clientId: 'client_del',
      });

      const response = await request(app)
        .delete(`/api/admin/connected-apps/${appDoc._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await ConnectedApp.findById(appDoc._id);
      expect(deleted.isActive).toBe(false);
    });
  });

  describe('POST /api/admin/connected-apps/:id/regenerate-secret', () => {
    it('should regenerate client secret', async () => {
      const appDoc = await ConnectedApp.create({
        name: 'Test App',
        organization: orgId,
        authType: 'oauth',
        clientId: 'client_reg',
        clientSecretHash: 'old_hash',
      });

      const response = await request(app)
        .post(`/api/admin/connected-apps/${appDoc._id}/regenerate-secret`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.clientSecret).toBeDefined();
    });
  });
});