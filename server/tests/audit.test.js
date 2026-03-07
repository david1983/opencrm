import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Audit Controller', () => {
  let app;
  let token;
  let userId;
  let orgId;
  let accountId;

  beforeAll(async () => {
    app = createApp;
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Account.deleteMany({});
    await AuditLog.deleteMany({});

    // Create organization
    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    // Create user
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    // Create account
    const account = await Account.create({
      name: 'Test Account',
      owner: userId,
      organization: orgId,
    });
    accountId = account._id;

    // Create audit logs
    await AuditLog.create([
      {
        entityType: 'Account',
        entityId: accountId,
        action: 'create',
        changes: [{ field: 'name', oldValue: null, newValue: 'Test Account' }],
        changedBy: userId,
        organization: orgId,
      },
      {
        entityType: 'Account',
        entityId: accountId,
        action: 'update',
        changes: [{ field: 'name', oldValue: 'Test Account', newValue: 'Updated Account' }],
        changedBy: userId,
        organization: orgId,
      },
    ]);

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('GET /api/audit/:entityType/:entityId', () => {
    it('should return audit logs for an entity', async () => {
      const response = await request(app)
        .get(`/api/audit/Account/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for non-existent entity', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/audit/Account/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return 400 for invalid entity type', async () => {
      const response = await request(app)
        .get(`/api/audit/InvalidEntity/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid entity type');
    });
  });

  describe('GET /api/audit/recent', () => {
    it('should return recent audit logs', async () => {
      const response = await request(app)
        .get('/api/audit/recent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      // Create additional audit logs
      const additionalLogs = [];
      for (let i = 0; i < 10; i++) {
        additionalLogs.push({
          entityType: 'Contact',
          entityId: new mongoose.Types.ObjectId(),
          action: 'create',
          changes: [],
          changedBy: userId,
          organization: orgId,
        });
      }
      await AuditLog.create(additionalLogs);

      const response = await request(app)
        .get('/api/audit/recent?limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });
});