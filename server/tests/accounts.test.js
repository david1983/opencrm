import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';

describe('Account Controller', () => {
  let app;
  let token;
  let userId;
  let orgId;

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

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Acme Corporation',
          industry: 'Technology',
          website: 'https://acme.com',
          phone: '+1-555-123-4567',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Acme Corporation');
    });

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          industry: 'Technology',
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'No Auth Account',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/accounts', () => {
    beforeEach(async () => {
      // Create test accounts
      await Account.create([
        { name: 'Account 1', owner: userId, organization: orgId },
        { name: 'Account 2', owner: userId, organization: orgId },
        { name: 'Account 3', owner: userId, organization: orgId },
      ]);
    });

    it('should return list of accounts', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/accounts?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/accounts/:id', () => {
    let accountId;

    beforeEach(async () => {
      const account = await Account.create({
        name: 'Test Account',
        industry: 'Healthcare',
        owner: userId,
        organization: orgId,
      });
      accountId = account._id;
    });

    it('should return account details', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Account');
      expect(response.body.data.industry).toBe('Healthcare');
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .get('/api/accounts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    let accountId;

    beforeEach(async () => {
      const account = await Account.create({
        name: 'Update Test',
        owner: userId,
        organization: orgId,
      });
      accountId = account._id;
    });

    it('should update account', async () => {
      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          industry: 'Finance',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.industry).toBe('Finance');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    let accountId;

    beforeEach(async () => {
      const account = await Account.create({
        name: 'Delete Test',
        owner: userId,
        organization: orgId,
      });
      accountId = account._id;
    });

    it('should delete account', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deleted
      const deleted = await Account.findById(accountId);
      expect(deleted).toBeNull();
    });
  });
});