import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Contact from '../src/models/Contact.js';
import Account from '../src/models/Account.js';

describe('Contact Controller', () => {
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

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-123-4567',
          account: accountId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
    });

    it('should require first name and last name', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'no-name@example.com',
        });

      expect(response.status).toBe(400);
    });

    it('should link contact to account', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          account: accountId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.account).toBe(accountId.toString());
    });
  });

  describe('GET /api/contacts', () => {
    beforeEach(async () => {
      // Create test contacts
      await Contact.create([
        { firstName: 'John', lastName: 'Doe', email: 'john@test.com', owner: userId, organization: orgId },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', owner: userId, organization: orgId, account: accountId },
        { firstName: 'Bob', lastName: 'Wilson', email: 'bob@test.com', owner: userId, organization: orgId },
      ]);
    });

    it('should return list of contacts', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter by account', async () => {
      const response = await request(app)
        .get(`/api/contacts?account=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Jane');
    });
  });

  describe('PUT /api/contacts/:id', () => {
    let contactId;

    beforeEach(async () => {
      const contact = await Contact.create({
        firstName: 'Update',
        lastName: 'Test',
        email: 'update@test.com',
        owner: userId,
        organization: orgId,
      });
      contactId = contact._id;
    });

    it('should update contact', async () => {
      const response = await request(app)
        .put(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Updated',
          lastName: 'Test',
          email: 'updated@test.com',
          title: 'CEO',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.title).toBe('CEO');
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    let contactId;

    beforeEach(async () => {
      const contact = await Contact.create({
        firstName: 'Delete',
        lastName: 'Test',
        email: 'delete@test.com',
        owner: userId,
        organization: orgId,
      });
      contactId = contact._id;
    });

    it('should delete contact', async () => {
      const response = await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify deleted
      const deleted = await Contact.findById(contactId);
      expect(deleted).toBeNull();
    });
  });
});