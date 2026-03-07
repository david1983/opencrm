import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Auth Controller Extended', () => {
  let app;

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
  });

  describe('GET /api/auth/me', () => {
    it('should return current user', async () => {
      // Create organization and user
      const org = await Organization.create({ name: 'Test Org' });
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        organization: org._id,
      });

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });

      const token = loginRes.body.token;

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@test.com');
      expect(response.body.data.name).toBe('Test User');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/register - extended', () => {
    it('should not register duplicate email', async () => {
      const org = await Organization.create({ name: 'Test Org' });
      await User.create({
        name: 'Existing User',
        email: 'existing@test.com',
        password: 'password123',
        organization: org._id,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'existing@test.com',
          password: 'password456',
        });

      expect(response.status).toBe(400);
    });

    it('should create organization if none exists', async () => {
      // Ensure no organizations exist
      await Organization.deleteMany({});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'first@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify organization was created
      const orgs = await Organization.find({});
      expect(orgs.length).toBe(1);
    });

    it('should use existing organization if one exists', async () => {
      const existingOrg = await Organization.create({ name: 'Existing Org' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);

      // Verify user was added to existing organization
      const user = await User.findOne({ email: 'newuser@test.com' });
      expect(user.organization.toString()).toBe(existingOrg._id.toString());
    });
  });

  describe('POST /api/auth/login - extended', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.errors).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.errors).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const org = await Organization.create({ name: 'Test Org' });
      await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        organization: org._id,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for OAuth user trying password login', async () => {
      const org = await Organization.create({ name: 'Test Org' });
      // Create user without password (OAuth user)
      await User.create({
        name: 'OAuth User',
        email: 'oauth@test.com',
        // No password
        provider: 'google',
        providerId: '12345',
        organization: org._id,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'oauth@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Please use OAuth to login');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});