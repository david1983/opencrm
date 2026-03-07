import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Lead from '../src/models/Lead.js';
import Opportunity from '../src/models/Opportunity.js';
import Activity from '../src/models/Activity.js';
import Account from '../src/models/Account.js';
import Task from '../src/models/Task.js';
import Contact from '../src/models/Contact.js';

describe('Report Controller - Extended', () => {
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
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Lead.deleteMany({});
    await Opportunity.deleteMany({});
    await Activity.deleteMany({});
    await Account.deleteMany({});
    await Task.deleteMany({});
    await Contact.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;
  });

  describe('GET /api/reports/leads-by-status', () => {
    beforeEach(async () => {
      await Lead.create([
        { firstName: 'L1', lastName: 'Test', email: 'l1@test.com', owner: userId, organization: orgId, status: 'New' },
        { firstName: 'L2', lastName: 'Test', email: 'l2@test.com', owner: userId, organization: orgId, status: 'New' },
        { firstName: 'L3', lastName: 'Test', email: 'l3@test.com', owner: userId, organization: orgId, status: 'Contacted' },
      ]);
    });

    it('should return leads grouped by status', async () => {
      const response = await request(app)
        .get('/api/reports/leads-by-status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/reports/activities with date filtering', () => {
    beforeEach(async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await Activity.create([
        { type: 'Call', subject: 'Past Call', owner: userId, organization: orgId, date: pastDate },
        { type: 'Email', subject: 'Future Email', owner: userId, organization: orgId, date: futureDate },
      ]);
    });

    it('should filter activities by start date', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const startDateStr = startDate.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/reports/activities?startDate=${startDateStr}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter activities by end date', async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/reports/activities?endDate=${endDateStr}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter activities by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);

      const response = await request(app)
        .get(`/api/reports/activities?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/dashboard with data', () => {
    beforeEach(async () => {
      const account = await Account.create({
        name: 'Test Account',
        owner: userId,
        organization: orgId,
      });

      const contact = await Contact.create({
        firstName: 'Test',
        lastName: 'Contact',
        email: 'contact@test.com',
        owner: userId,
        organization: orgId,
      });

      // Create overdue task
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await Task.create([
        { subject: 'Overdue Task', owner: userId, organization: orgId, dueDate: pastDate, status: 'Not Started' },
        { subject: 'Future Task', owner: userId, organization: orgId, dueDate: new Date(Date.now() + 86400000), status: 'Not Started' },
      ]);

      // Create open opportunity
      await Opportunity.create({
        name: 'Open Deal',
        owner: userId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(Date.now() + 86400000 * 30),
        amount: 50000,
      });
    });

    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.counts).toBeDefined();
      expect(response.body.data.overdueTasks).toBeDefined();
      expect(response.body.data.upcomingTasks).toBeDefined();
      expect(response.body.data.openOpportunities).toBeDefined();
      expect(response.body.data.pipelineValue).toBeDefined();
    });

    it('should count overdue tasks correctly', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.overdueTasks).toBe(1);
    });
  });

  describe('GET /api/reports/pipeline with various stages', () => {
    it('should handle empty pipeline', async () => {
      await Opportunity.deleteMany({});

      const response = await request(app)
        .get('/api/reports/pipeline')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stages).toEqual([]);
      expect(response.body.data.summary.totalValue).toBe(0);
      expect(response.body.data.summary.totalCount).toBe(0);
      expect(response.body.data.summary.avgDealSize).toBe(0);
    });
  });
});