import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Activity from '../src/models/Activity.js';
import Contact from '../src/models/Contact.js';
import Account from '../src/models/Account.js';

describe('Activity Controller', () => {
  let app;
  let token;
  let userId;
  let orgId;
  let contactId;
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
    await Activity.deleteMany({});
    await Contact.deleteMany({});
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

    // Create contact
    const contact = await Contact.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      owner: userId,
      organization: orgId,
    });
    contactId = contact._id;

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/activities', () => {
    it('should create a new activity', async () => {
      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'Call',
          subject: 'First call',
          description: 'Initial contact call',
          date: '2024-01-15',
          contact: contactId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('Call');
      expect(response.body.data.subject).toBe('First call');
    });

    it('should require type and subject', async () => {
      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing type and subject',
        });

      expect(response.status).toBe(400);
    });

    it('should create activity with different types', async () => {
      const types = ['Call', 'Email', 'Meeting', 'Note'];

      for (const type of types) {
        const response = await request(app)
          .post('/api/activities')
          .set('Authorization', `Bearer ${token}`)
          .send({
            type,
            subject: `${type} activity`,
            date: '2024-01-15',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.type).toBe(type);
      }
    });
  });

  describe('GET /api/activities', () => {
    beforeEach(async () => {
      await Activity.create([
        {
          type: 'Call',
          subject: 'Call 1',
          owner: userId,
          organization: orgId,
          contact: contactId,
          date: new Date(),
        },
        {
          type: 'Email',
          subject: 'Email 1',
          owner: userId,
          organization: orgId,
          account: accountId,
          date: new Date(),
        },
        {
          type: 'Meeting',
          subject: 'Meeting 1',
          owner: userId,
          organization: orgId,
          date: new Date(),
        },
      ]);
    });

    it('should return list of activities', async () => {
      const response = await request(app)
        .get('/api/activities')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/activities?type=Call')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('Call');
    });

    it('should filter by contact', async () => {
      const response = await request(app)
        .get(`/api/activities?contact=${contactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/activities/:id', () => {
    let activityId;

    beforeEach(async () => {
      const activity = await Activity.create({
        type: 'Call',
        subject: 'Test Activity',
        owner: userId,
        organization: orgId,
        date: new Date(),
      });
      activityId = activity._id;
    });

    it('should return activity details', async () => {
      const response = await request(app)
        .get(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subject).toBe('Test Activity');
    });

    it('should return 404 for non-existent activity', async () => {
      const response = await request(app)
        .get('/api/activities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/activities/:id', () => {
    let activityId;

    beforeEach(async () => {
      const activity = await Activity.create({
        type: 'Call',
        subject: 'Update Activity',
        owner: userId,
        organization: orgId,
        date: new Date(),
      });
      activityId = activity._id;
    });

    it('should update activity', async () => {
      const response = await request(app)
        .put(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'Call',
          subject: 'Updated Subject',
          description: 'Updated description',
          date: '2024-01-20',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.subject).toBe('Updated Subject');
      expect(response.body.data.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/activities/:id', () => {
    let activityId;

    beforeEach(async () => {
      const activity = await Activity.create({
        type: 'Call',
        subject: 'Delete Activity',
        owner: userId,
        organization: orgId,
        date: new Date(),
      });
      activityId = activity._id;
    });

    it('should delete activity', async () => {
      const response = await request(app)
        .delete(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const deleted = await Activity.findById(activityId);
      expect(deleted).toBeNull();
    });
  });
});