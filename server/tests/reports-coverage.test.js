import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';
import Opportunity from '../src/models/Opportunity.js';
import Activity from '../src/models/Activity.js';
import Task from '../src/models/Task.js';
import Lead from '../src/models/Lead.js';

describe('Reports - Additional Coverage', () => {
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
    await Account.deleteMany({});
    await Contact.deleteMany({});
    await Opportunity.deleteMany({});
    await Activity.deleteMany({});
    await Task.deleteMany({});
    await Lead.deleteMany({});

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
    it('should return leads by status', async () => {
      await Lead.create([
        { firstName: 'L1', lastName: 'T', email: 'l1@test.com', owner: userId, organization: orgId, status: 'New' },
        { firstName: 'L2', lastName: 'T', email: 'l2@test.com', owner: userId, organization: orgId, status: 'New' },
        { firstName: 'L3', lastName: 'T', email: 'l3@test.com', owner: userId, organization: orgId, status: 'Contacted' },
      ]);

      const response = await request(app)
        .get('/api/reports/leads-by-status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/dashboard - with tasks', () => {
    it('should handle overdue and upcoming tasks', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      await Task.create([
        { subject: 'Overdue', owner: userId, organization: orgId, dueDate: pastDate, status: 'Not Started' },
        { subject: 'Upcoming', owner: userId, organization: orgId, dueDate: futureDate, status: 'In Progress' },
        { subject: 'Completed', owner: userId, organization: orgId, dueDate: pastDate, status: 'Completed' },
      ]);

      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.overdueTasks).toBe(1);
    });
  });
});