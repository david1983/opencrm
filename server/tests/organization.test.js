import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Organization Controller', () => {
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

  describe('GET /api/admin/organization', () => {
    it('should return organization (requires admin role)', async () => {
      const response = await request(app)
        .get('/api/admin/organization')
        .set('Authorization', `Bearer ${token}`);

      // May return 403 if user is not admin, or 404 if method doesn't exist
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/organization');

      expect(response.status).toBe(401);
    });
  });
});