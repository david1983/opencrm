import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Opportunity from '../src/models/Opportunity.js';
import Account from '../src/models/Account.js';

describe('Opportunity Controller', () => {
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
    await Opportunity.deleteMany({});
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

    // Create account
    const account = await Account.create({
      name: 'Test Account',
      owner: userId,
      organization: orgId,
    });
    accountId = account._id;

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/opportunities', () => {
    it('should create a new opportunity', async () => {
      const response = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Deal',
          account: accountId,
          amount: 10000,
          stage: 'Prospecting',
          closeDate: '2024-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Deal');
      expect(response.body.data.probability).toBe(10); // Auto-set for Prospecting
    });

    it('should require name and closeDate', async () => {
      const response = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000,
        });

      expect(response.status).toBe(400);
    });

    it('should auto-set probability based on stage', async () => {
      const stages = [
        { stage: 'Prospecting', expectedProbability: 10 },
        { stage: 'Qualification', expectedProbability: 20 },
        { stage: 'Proposal', expectedProbability: 50 },
        { stage: 'Negotiation', expectedProbability: 75 },
        { stage: 'Closed Won', expectedProbability: 100 },
        { stage: 'Closed Lost', expectedProbability: 0 },
      ];

      for (const { stage, expectedProbability } of stages) {
        const response = await request(app)
          .post('/api/opportunities')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: `Deal - ${stage}`,
            stage,
            closeDate: '2024-12-31',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.probability).toBe(expectedProbability);
      }
    });
  });

  describe('GET /api/opportunities', () => {
    beforeEach(async () => {
      // Create test opportunities
      await Opportunity.create([
        { name: 'Deal 1', owner: userId, organization: orgId, stage: 'Prospecting', closeDate: new Date() },
        { name: 'Deal 2', owner: userId, organization: orgId, stage: 'Proposal', account: accountId, closeDate: new Date() },
        { name: 'Deal 3', owner: userId, organization: orgId, stage: 'Negotiation', closeDate: new Date() },
      ]);
    });

    it('should return list of opportunities', async () => {
      const response = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter by stage', async () => {
      const response = await request(app)
        .get('/api/opportunities?stage=Proposal')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Deal 2');
    });

    it('should filter by account', async () => {
      const response = await request(app)
        .get(`/api/opportunities?account=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('PUT /api/opportunities/:id', () => {
    let opportunityId;

    beforeEach(async () => {
      const opportunity = await Opportunity.create({
        name: 'Update Test',
        owner: userId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(),
      });
      opportunityId = opportunity._id;
    });

    it('should update opportunity stage and probability', async () => {
      const response = await request(app)
        .put(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          stage: 'Proposal',
          amount: 50000,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.stage).toBe('Proposal');
      expect(response.body.data.probability).toBe(50);
    });
  });

  describe('DELETE /api/opportunities/:id', () => {
    let opportunityId;

    beforeEach(async () => {
      const opportunity = await Opportunity.create({
        name: 'Delete Test',
        owner: userId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(),
      });
      opportunityId = opportunity._id;
    });

    it('should delete opportunity', async () => {
      const response = await request(app)
        .delete(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify deleted
      const deleted = await Opportunity.findById(opportunityId);
      expect(deleted).toBeNull();
    });
  });
});