import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Activity from '../src/models/Activity.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';

describe('Activity Controller - Extended', () => {
  let app;
  let token;
  let userId;
  let adminToken;
  let adminId;
  let orgId;
  let accountId;
  let contactId;

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
    await Activity.deleteMany({});
    await Account.deleteMany({});
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

    const contact = await Contact.create({
      firstName: 'Test',
      lastName: 'Contact',
      email: 'contact@test.com',
      owner: userId,
      organization: orgId,
    });
    contactId = contact._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/activities', () => {
    beforeEach(async () => {
      await Activity.create([
        {
          type: 'Call',
          subject: 'Call 1',
          owner: userId,
          organization: orgId,
          date: new Date(),
          account: accountId,
        },
        {
          type: 'Email',
          subject: 'Email 1',
          owner: userId,
          organization: orgId,
          date: new Date(),
          contact: contactId,
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

    it('should filter activities by type', async () => {
      const response = await request(app)
        .get('/api/activities?type=Call')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(a => a.type === 'Call')).toBe(true);
    });

    it('should filter activities by contact', async () => {
      const response = await request(app)
        .get(`/api/activities?contact=${contactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('should filter activities by account', async () => {
      const response = await request(app)
        .get(`/api/activities?account=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('should return pagination info', async () => {
      const response = await request(app)
        .get('/api/activities?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/activities/:id', () => {
    let activityId;

    beforeEach(async () => {
      const activity = await Activity.create({
        type: 'Call',
        subject: 'Test Call',
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
      expect(response.body.data.subject).toBe('Test Call');
    });

    it('should return 404 for non-existent activity', async () => {
      const response = await request(app)
        .get('/api/activities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Activity not found');
    });
  });

  describe('PUT /api/activities/:id', () => {
    let activityId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const activity = await Activity.create({
        type: 'Call',
        subject: 'Original Call',
        owner: otherUserId,
        organization: orgId,
        date: new Date(),
      });
      activityId = activity._id;
    });

    it('should return 404 for non-existent activity update', async () => {
      const response = await request(app)
        .put('/api/activities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'Email', subject: 'Updated', date: '2024-12-31' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Activity not found');
    });

    it('should return 403 when updating another users activity', async () => {
      const response = await request(app)
        .put(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'Email', subject: 'Unauthorized Update', date: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this activity');
    });

    it('should allow admin to update any activity', async () => {
      const response = await request(app)
        .put(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'Email', subject: 'Admin Updated', date: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.data.subject).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/activities/:id', () => {
    let activityId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const activity = await Activity.create({
        type: 'Call',
        subject: 'Test Call',
        owner: otherUserId,
        organization: orgId,
        date: new Date(),
      });
      activityId = activity._id;
    });

    it('should return 404 for non-existent activity delete', async () => {
      const response = await request(app)
        .delete('/api/activities/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Activity not found');
    });

    it('should return 403 when deleting another users activity', async () => {
      const response = await request(app)
        .delete(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this activity');
    });

    it('should allow admin to delete any activity', async () => {
      const response = await request(app)
        .delete(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Activity.findById(activityId);
      expect(deleted).toBeNull();
    });
  });
});