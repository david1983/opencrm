import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Lead from '../src/models/Lead.js';

describe('Lead Controller', () => {
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

  describe('POST /api/leads', () => {
    it('should create a new lead', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          company: 'Acme Inc',
          status: 'New',
          source: 'Website',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
    });

    it('should require first name and last name', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'incomplete@example.com',
        });

      expect(response.status).toBe(400);
    });

    it('should set default status to New', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('New');
    });
  });

  describe('GET /api/leads', () => {
    beforeEach(async () => {
      // Create test leads
      await Lead.create([
        { firstName: 'Lead1', lastName: 'Test', email: 'lead1@test.com', owner: userId, organization: orgId, status: 'New' },
        { firstName: 'Lead2', lastName: 'Test', email: 'lead2@test.com', owner: userId, organization: orgId, status: 'Contacted' },
        { firstName: 'Lead3', lastName: 'Test', email: 'lead3@test.com', owner: userId, organization: orgId, status: 'Qualified' },
      ]);
    });

    it('should return list of leads', async () => {
      const response = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/leads?status=New')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('New');
    });

    it('should filter by source', async () => {
      await Lead.create({
        firstName: 'Lead4',
        lastName: 'Test',
        email: 'lead4@test.com',
        owner: userId,
        organization: orgId,
        source: 'Referral',
      });

      const response = await request(app)
        .get('/api/leads?source=Referral')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].source).toBe('Referral');
    });
  });

  describe('GET /api/leads/:id', () => {
    let leadId;

    beforeEach(async () => {
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'Lead',
        email: 'testlead@example.com',
        owner: userId,
        organization: orgId,
      });
      leadId = lead._id;
    });

    it('should return lead details', async () => {
      const response = await request(app)
        .get(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Test');
      expect(response.body.data.lastName).toBe('Lead');
    });

    it('should return 404 for non-existent lead', async () => {
      const response = await request(app)
        .get('/api/leads/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/leads/:id', () => {
    let leadId;

    beforeEach(async () => {
      const lead = await Lead.create({
        firstName: 'Update',
        lastName: 'Lead',
        email: 'update@example.com',
        owner: userId,
        organization: orgId,
      });
      leadId = lead._id;
    });

    it('should update lead', async () => {
      const response = await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Updated',
          status: 'Contacted',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.status).toBe('Contacted');
    });
  });

  describe('DELETE /api/leads/:id', () => {
    let leadId;

    beforeEach(async () => {
      const lead = await Lead.create({
        firstName: 'Delete',
        lastName: 'Lead',
        email: 'delete@example.com',
        owner: userId,
        organization: orgId,
      });
      leadId = lead._id;
    });

    it('should delete lead', async () => {
      const response = await request(app)
        .delete(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify deleted
      const deleted = await Lead.findById(leadId);
      expect(deleted).toBeNull();
    });
  });
});