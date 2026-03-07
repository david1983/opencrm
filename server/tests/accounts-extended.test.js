import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';

describe('Account Controller - Extended', () => {
  let app;
  let token;
  let userId;
  let adminToken;
  let adminId;
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
    await Organization.deleteMany({});
    await Account.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });
    adminId = admin._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/accounts', () => {
    beforeEach(async () => {
      await Account.create([
        { name: 'Tech Corp', industry: 'Technology', owner: userId, organization: orgId },
        { name: 'Health Inc', industry: 'Healthcare', owner: userId, organization: orgId },
        { name: 'Finance LLC', industry: 'Finance', owner: userId, organization: orgId },
      ]);
    });

    it('should filter by industry', async () => {
      const response = await request(app)
        .get('/api/accounts?industry=Technology')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].industry).toBe('Technology');
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/accounts?search=Tech')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Tech Corp');
    });

    it('should return empty for no matches', async () => {
      const response = await request(app)
        .get('/api/accounts?search=nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    let accountId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const account = await Account.create({
        name: 'Test Account',
        owner: otherUserId,
        organization: orgId,
      });
      accountId = account._id;
    });

    it('should return 404 for non-existent account update', async () => {
      const response = await request(app)
        .put('/api/accounts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Account not found');
    });

    it('should return 403 when updating another users account', async () => {
      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unauthorized Update' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this account');
    });

    it('should allow admin to update any account', async () => {
      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated', industry: 'Technology' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    let accountId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const account = await Account.create({
        name: 'Test Account',
        owner: otherUserId,
        organization: orgId,
      });
      accountId = account._id;
    });

    it('should return 404 for non-existent account delete', async () => {
      const response = await request(app)
        .delete('/api/accounts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Account not found');
    });

    it('should return 403 when deleting another users account', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this account');
    });

    it('should allow admin to delete any account', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Account.findById(accountId);
      expect(deleted).toBeNull();
    });
  });
});