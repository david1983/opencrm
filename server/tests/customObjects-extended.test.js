import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import CustomObject from '../src/models/CustomObject.js';
import CustomField from '../src/models/CustomField.js';

describe('Custom Object Controller - Extended', () => {
  let app;
  let adminToken;
  let orgId;
  let objectId;

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
    await CustomObject.deleteMany({});
    await CustomField.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = response.body.token;
  });

  describe('GET /api/admin/setup/objects/:id', () => {
    it('should return 404 for non-existent object', async () => {
      const response = await request(app)
        .get('/api/admin/setup/objects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Object not found');
    });
  });

  describe('PUT /api/admin/setup/objects/:id', () => {
    let objectId;

    beforeEach(async () => {
      const obj = await CustomObject.create({
        name: 'Project',
        label: 'Project',
        pluralLabel: 'Projects',
        organization: orgId,
      });
      objectId = obj._id;
    });

    it('should return 404 for non-existent object update', async () => {
      const response = await request(app)
        .put('/api/admin/setup/objects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Object not found');
    });

    it('should update object fields', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/objects/${objectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          label: 'Updated Project',
          description: 'A project object',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.label).toBe('Updated Project');
      expect(response.body.data.description).toBe('A project object');
    });
  });

  describe('DELETE /api/admin/setup/objects/:id', () => {
    it('should return 404 for non-existent object delete', async () => {
      const response = await request(app)
        .delete('/api/admin/setup/objects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Object not found');
    });
  });
});