import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';

describe('Contact Controller - Extended', () => {
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

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/contacts', () => {
    beforeEach(async () => {
      await Contact.create([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          owner: userId,
          organization: orgId,
          account: accountId,
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          owner: userId,
          organization: orgId,
          account: accountId,
        },
        {
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@test.com',
          owner: userId,
          organization: orgId,
        },
      ]);
    });

    it('should return all contacts with pagination', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
    });

    it('should search contacts by name', async () => {
      const response = await request(app)
        .get('/api/contacts?search=John')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].firstName).toBe('John');
    });

    it('should filter contacts by account', async () => {
      const response = await request(app)
        .get(`/api/contacts?account=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/contacts?search=nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/contacts/:id', () => {
    let contactId;

    beforeEach(async () => {
      const contact = await Contact.create({
        firstName: 'Test',
        lastName: 'Contact',
        email: 'testcontact@test.com',
        owner: userId,
        organization: orgId,
        account: accountId,
      });
      contactId = contact._id;
    });

    it('should return a single contact', async () => {
      const response = await request(app)
        .get(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Test');
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/contacts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Contact not found');
    });
  });

  describe('PUT /api/contacts/:id', () => {
    let contactId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const contact = await Contact.create({
        firstName: 'Original',
        lastName: 'Name',
        email: 'original@test.com',
        owner: otherUserId,
        organization: orgId,
      });
      contactId = contact._id;
    });

    it('should return 404 for non-existent contact update', async () => {
      const response = await request(app)
        .put('/api/contacts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 403 when updating another users contact', async () => {
      const response = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this contact');
    });

    it('should allow admin to update any contact', async () => {
      const response = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Admin Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    let contactId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const contact = await Contact.create({
        firstName: 'To',
        lastName: 'Delete',
        email: 'delete@test.com',
        owner: otherUserId,
        organization: orgId,
      });
      contactId = contact._id;
    });

    it('should return 404 for non-existent contact delete', async () => {
      const response = await request(app)
        .delete('/api/contacts/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 403 when deleting another users contact', async () => {
      const response = await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this contact');
    });

    it('should allow admin to delete any contact', async () => {
      const response = await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Contact.findById(contactId);
      expect(deleted).toBeNull();
    });
  });
});