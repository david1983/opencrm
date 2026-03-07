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
  });

  describe('POST /api/auth/login - extended', () => {
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
  });
});