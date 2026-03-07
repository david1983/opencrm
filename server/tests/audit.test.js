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

  describe('GET /api/audit', () => {
    it('should return audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by entity type', async () => {
      const response = await request(app)
        .get('/api/audit?entityType=Account')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(log => log.entityType === 'Account')).toBe(true);
    });

    it('should filter by entity id', async () => {
      const response = await request(app)
        .get(`/api/audit?entityId=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(log => log.entityId.toString() === accountId.toString())).toBe(true);
    });
  });
});