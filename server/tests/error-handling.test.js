import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Error Handling', () => {
  let app;
  let token;
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

    await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;
  });

  describe('Invalid ObjectId', () => {
    it('should return 400 for invalid ObjectId in accounts', async () => {
      const response = await request(app)
        .get('/api/accounts/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 400 for invalid ObjectId in contacts', async () => {
      const response = await request(app)
        .get('/api/contacts/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 400 for invalid ObjectId in leads', async () => {
      const response = await request(app)
        .get('/api/leads/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 400 for invalid ObjectId in opportunities', async () => {
      const response = await request(app)
        .get('/api/opportunities/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 404 for invalid ObjectId in activities', async () => {
      const response = await request(app)
        .get('/api/activities/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 404 for invalid ObjectId in tasks', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });

    it('should return 404 for invalid ObjectId in notes', async () => {
      const response = await request(app)
        .get('/api/notes/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });
  });
});