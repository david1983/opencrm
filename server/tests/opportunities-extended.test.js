import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Opportunity from '../src/models/Opportunity.js';
import Account from '../src/models/Account.js';

describe('Opportunity Controller - Extended', () => {
  let app;
  let token;
  let userId;
  let adminToken;
  let adminId;
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
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Opportunity.deleteMany({});
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

    const account = await Account.create({
      name: 'Test Account',
      owner: userId,
      organization: orgId,
    });
    accountId = account._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/opportunities/:id', () => {
    let opportunityId;

    beforeEach(async () => {
      const opportunity = await Opportunity.create({
        name: 'Test Opportunity',
        owner: userId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(),
      });
      opportunityId = opportunity._id;
    });

    it('should return a single opportunity', async () => {
      const response = await request(app)
        .get(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Opportunity');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const response = await request(app)
        .get('/api/opportunities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Opportunity not found');
    });
  });

  describe('PUT /api/opportunities/:id', () => {
    let opportunityId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const opportunity = await Opportunity.create({
        name: 'Test Opportunity',
        owner: otherUserId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(),
      });
      opportunityId = opportunity._id;
    });

    it('should return 404 for non-existent opportunity update', async () => {
      const response = await request(app)
        .put('/api/opportunities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated', stage: 'Proposal', closeDate: '2024-12-31' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Opportunity not found');
    });

    it('should return 403 when updating another users opportunity', async () => {
      const response = await request(app)
        .put(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unauthorized Update', stage: 'Proposal', closeDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this opportunity');
    });

    it('should allow admin to update any opportunity', async () => {
      const response = await request(app)
        .put(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated', stage: 'Proposal', closeDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/opportunities/:id', () => {
    let opportunityId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const opportunity = await Opportunity.create({
        name: 'Test Opportunity',
        owner: otherUserId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(),
      });
      opportunityId = opportunity._id;
    });

    it('should return 404 for non-existent opportunity delete', async () => {
      const response = await request(app)
        .delete('/api/opportunities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Opportunity not found');
    });

    it('should return 403 when deleting another users opportunity', async () => {
      const response = await request(app)
        .delete(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this opportunity');
    });

    it('should allow admin to delete any opportunity', async () => {
      const response = await request(app)
        .delete(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Opportunity.findById(opportunityId);
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/opportunities with filters', () => {
    beforeEach(async () => {
      await Opportunity.create([
        {
          name: 'Deal 1',
          owner: userId,
          organization: orgId,
          stage: 'Prospecting',
          closeDate: new Date(),
        },
        {
          name: 'Deal 2',
          owner: userId,
          organization: orgId,
          stage: 'Proposal',
          account: accountId,
          closeDate: new Date(),
        },
        {
          name: 'Deal 3',
          owner: userId,
          organization: orgId,
          stage: 'Closed Won',
          closeDate: new Date(),
        },
      ]);
    });

    it('should search opportunities', async () => {
      const response = await request(app)
        .get('/api/opportunities?search=Deal')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by multiple stages', async () => {
      const response = await request(app)
        .get('/api/opportunities?stage=Prospecting')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(o => o.stage === 'Prospecting')).toBe(true);
    });

    it('should return pagination info', async () => {
      const response = await request(app)
        .get('/api/opportunities?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });
});