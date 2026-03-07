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
import Note from '../src/models/Note.js';

describe('Additional Coverage Tests', () => {
  let app;
  let token;
  let userId;
  let orgId;
  let adminToken;

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
    await Note.deleteMany({});

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

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('Activities - Additional Tests', () => {
    it('should create activity with all fields', async () => {
      const account = await Account.create({
        name: 'Test Account',
        owner: userId,
        organization: orgId,
      });

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'Meeting',
          subject: 'Client Meeting',
          description: 'Quarterly review',
          date: new Date().toISOString(),
          duration: 60,
          account: account._id,
        });

      expect(response.status).toBe(201);
    });

    it('should filter activities by opportunity', async () => {
      const opportunity = await Opportunity.create({
        name: 'Test Opp',
        owner: userId,
        organization: orgId,
        stage: 'Prospecting',
        closeDate: new Date(),
      });

      await Activity.create({
        type: 'Call',
        subject: 'Follow up',
        owner: userId,
        organization: orgId,
        date: new Date(),
        opportunity: opportunity._id,
      });

      const response = await request(app)
        .get(`/api/activities?opportunity=${opportunity._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('Tasks - Additional Tests', () => {
    it('should create task with all fields', async () => {
      const account = await Account.create({
        name: 'Test Account',
        owner: userId,
        organization: orgId,
      });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Follow up with client',
          description: 'Discuss proposal',
          dueDate: new Date().toISOString(),
          status: 'Not Started',
          priority: 'High',
          account: account._id,
        });

      expect(response.status).toBe(201);
    });

    it('should filter tasks by status and priority', async () => {
      await Task.create([
        {
          subject: 'Task 1',
          owner: userId,
          organization: orgId,
          dueDate: new Date(),
          status: 'Not Started',
          priority: 'High',
        },
        {
          subject: 'Task 2',
          owner: userId,
          organization: orgId,
          dueDate: new Date(),
          status: 'Completed',
          priority: 'Low',
        },
      ]);

      const response = await request(app)
        .get('/api/tasks?status=Not Started&priority=High')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('Notes - Additional Tests', () => {
    it('should create note for contact', async () => {
      const contact = await Contact.create({
        firstName: 'Test',
        lastName: 'Contact',
        email: 'test@test.com',
        owner: userId,
        organization: orgId,
      });

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Meeting Notes',
          content: 'Discussed requirements',
          parentType: 'Contact',
          parentId: contact._id,
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Leads - Additional Tests', () => {
    it('should filter leads by company', async () => {
      await Lead.create([
        {
          firstName: 'L1',
          lastName: 'T',
          email: 'l1@test.com',
          company: 'Acme Corp',
          owner: userId,
          organization: orgId,
        },
        {
          firstName: 'L2',
          lastName: 'T',
          email: 'l2@test.com',
          company: 'Other Inc',
          owner: userId,
          organization: orgId,
        },
      ]);

      const response = await request(app)
        .get('/api/leads?search=Acme')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Opportunities - Additional Tests', () => {
    it('should create opportunity with all fields', async () => {
      const account = await Account.create({
        name: 'Test Account',
        owner: userId,
        organization: orgId,
      });

      const response = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Big Deal',
          account: account._id,
          amount: 50000,
          stage: 'Proposal',
          probability: 50,
          closeDate: new Date().toISOString(),
          description: 'Large enterprise deal',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Reports - Additional Tests', () => {
    it('should handle activities report with date range', async () => {
      await Activity.create({
        type: 'Call',
        subject: 'Test Call',
        owner: userId,
        organization: orgId,
        date: new Date(),
      });

      const response = await request(app)
        .get('/api/reports/activities')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });
});