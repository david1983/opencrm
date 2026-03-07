import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Lead from '../src/models/Lead.js';
import Opportunity from '../src/models/Opportunity.js';
import Activity from '../src/models/Activity.js';
import Account from '../src/models/Account.js';

describe('Report Controller', () => {
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
    await Lead.deleteMany({});
    await Opportunity.deleteMany({});
    await Activity.deleteMany({});
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

    // Create test leads
    await Lead.create([
      { firstName: 'Lead1', lastName: 'Test', email: 'lead1@test.com', owner: userId, organization: orgId, status: 'New', source: 'Website' },
      { firstName: 'Lead2', lastName: 'Test', email: 'lead2@test.com', owner: userId, organization: orgId, status: 'Contacted', source: 'Referral' },
      { firstName: 'Lead3', lastName: 'Test', email: 'lead3@test.com', owner: userId, organization: orgId, status: 'Qualified', source: 'Website' },
      { firstName: 'Lead4', lastName: 'Test', email: 'lead4@test.com', owner: userId, organization: orgId, status: 'Converted', source: 'Trade Show' },
    ]);

    // Create test opportunities
    await Opportunity.create([
      { name: 'Deal 1', owner: userId, organization: orgId, stage: 'Prospecting', closeDate: new Date(), amount: 10000 },
      { name: 'Deal 2', owner: userId, organization: orgId, stage: 'Proposal', closeDate: new Date(), amount: 20000 },
      { name: 'Deal 3', owner: userId, organization: orgId, stage: 'Closed Won', closeDate: new Date(), amount: 50000 },
    ]);

    // Create test activities
    await Activity.create([
      { type: 'Call', subject: 'Call 1', owner: userId, organization: orgId, date: new Date() },
      { type: 'Email', subject: 'Email 1', owner: userId, organization: orgId, date: new Date() },
      { type: 'Meeting', subject: 'Meeting 1', owner: userId, organization: orgId, date: new Date() },
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

  describe('GET /api/reports/pipeline', () => {
    it('should return pipeline report', async () => {
      const response = await request(app)
        .get('/api/reports/pipeline')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should group opportunities by stage', async () => {
      const response = await request(app)
        .get('/api/reports/pipeline')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // Should have stages
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reports/activities', () => {
    it('should return activity summary', async () => {
      const response = await request(app)
        .get('/api/reports/activities')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should group activities by type', async () => {
      const response = await request(app)
        .get('/api/reports/activities')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reports/leads-by-source', () => {
    it('should return leads by source report', async () => {
      const response = await request(app)
        .get('/api/reports/leads-by-source')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should group leads by source', async () => {
      const response = await request(app)
        .get('/api/reports/leads-by-source')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});