import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Lead from '../src/models/Lead.js';
import Account from '../src/models/Account.js';

describe('Lead Controller - Extended', () => {
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
    await Lead.deleteMany({});
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

  describe('PUT /api/leads/:id', () => {
    let leadId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const lead = await Lead.create({
        firstName: 'Original',
        lastName: 'Lead',
        email: 'original@test.com',
        owner: otherUserId,
        organization: orgId,
      });
      leadId = lead._id;
    });

    it('should return 404 for non-existent lead update', async () => {
      const response = await request(app)
        .put('/api/leads/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated', lastName: 'Lead', email: 'updated@test.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Lead not found');
    });

    it('should return 403 when updating another users lead', async () => {
      const response = await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated', lastName: 'Lead', email: 'updated@test.com' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this lead');
    });

    it('should allow admin to update any lead', async () => {
      const response = await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Admin', lastName: 'Updated', email: 'admin@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Admin');
    });
  });

  describe('DELETE /api/leads/:id', () => {
    let leadId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const lead = await Lead.create({
        firstName: 'To',
        lastName: 'Delete',
        email: 'delete@test.com',
        owner: otherUserId,
        organization: orgId,
      });
      leadId = lead._id;
    });

    it('should return 404 for non-existent lead delete', async () => {
      const response = await request(app)
        .delete('/api/leads/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Lead not found');
    });

    it('should return 403 when deleting another users lead', async () => {
      const response = await request(app)
        .delete(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this lead');
    });

    it('should allow admin to delete any lead', async () => {
      const response = await request(app)
        .delete(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Lead.findById(leadId);
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/leads with filters', () => {
    beforeEach(async () => {
      await Lead.create([
        {
          firstName: 'Search',
          lastName: 'Test1',
          email: 'search1@test.com',
          owner: userId,
          organization: orgId,
          status: 'New',
          source: 'Website',
        },
        {
          firstName: 'Search',
          lastName: 'Test2',
          email: 'search2@test.com',
          owner: userId,
          organization: orgId,
          status: 'Contacted',
          source: 'Referral',
        },
      ]);
    });

    it('should search leads by name', async () => {
      const response = await request(app)
        .get('/api/leads?search=Search')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return pagination info', async () => {
      const response = await request(app)
        .get('/api/leads?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });
});