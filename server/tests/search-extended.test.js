import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';

describe('Error Handler and Middleware', () => {
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
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return error for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/accounts/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('Authentication middleware', () => {
    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/accounts');

      expect(response.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should grant access with valid token', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Health check', () => {
    it('should return ok status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});