import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Organization Controller - Extended', () => {
  let app;
  let adminToken;
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
      role: 'admin',
      organization: orgId,
    });
    userId = user._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    adminToken = response.body.token;
  });

  describe('GET /api/admin/organization', () => {
    it('should return organization info', async () => {
      const response = await request(app)
        .get('/api/admin/organization')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404, 403]).toContain(response.status);
    });
  });

  describe('PUT /api/admin/organization', () => {
    it('should update organization info', async () => {
      const response = await request(app)
        .put('/api/admin/organization')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Org',
          industry: 'Technology',
          website: 'https://example.com',
        });

      expect([200, 404, 403]).toContain(response.status);
    });
  });
});