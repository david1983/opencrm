import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import CustomObject from '../src/models/CustomObject.js';
import CustomField from '../src/models/CustomField.js';

describe('Custom Object Controller', () => {
  let app;
  let adminToken;
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
    await CustomObject.deleteMany({});
    await CustomField.deleteMany({});

    // Create organization
    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });

    // Login as admin
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    adminToken = response.body.token;
  });

  describe('POST /api/admin/setup/objects', () => {
    it('should create a custom object', async () => {
      const response = await request(app)
        .post('/api/admin/setup/objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Project',
          label: 'Project',
          pluralLabel: 'Projects',
          description: 'Track projects',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Project');
    });

    it('should prevent duplicate object names', async () => {
      await CustomObject.create({ name: 'Project', label: 'Project', pluralLabel: 'Projects' });

      const response = await request(app)
        .post('/api/admin/setup/objects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Project',
          label: 'Project',
          pluralLabel: 'Projects',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/setup/objects', () => {
    beforeEach(async () => {
      await CustomObject.create([
        { name: 'Project', label: 'Project', pluralLabel: 'Projects' },
        { name: 'Task', label: 'Task', pluralLabel: 'Tasks' },
      ]);
    });

    it('should return list of custom objects', async () => {
      const response = await request(app)
        .get('/api/admin/setup/objects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/admin/setup/objects/:id', () => {
    let objectId;

    beforeEach(async () => {
      const obj = await CustomObject.create({ name: 'Project', label: 'Project', pluralLabel: 'Projects' });
      objectId = obj._id;
      await CustomField.create({ object: objectId, name: 'name', label: 'Name', type: 'Text' });
    });

    it('should return custom object with fields', async () => {
      const response = await request(app)
        .get(`/api/admin/setup/objects/${objectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Project');
      expect(response.body.data.fields).toBeDefined();
      expect(response.body.data.fields.length).toBe(1);
    });

    it('should return 404 for non-existent object', async () => {
      const response = await request(app)
        .get('/api/admin/setup/objects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/setup/objects/:id', () => {
    let objectId;

    beforeEach(async () => {
      const obj = await CustomObject.create({ name: 'Project', label: 'Project', pluralLabel: 'Projects' });
      objectId = obj._id;
    });

    it('should update custom object', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/objects/${objectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          label: 'Updated Project',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.label).toBe('Updated Project');
    });
  });

  describe('DELETE /api/admin/setup/objects/:id', () => {
    let objectId;

    beforeEach(async () => {
      const obj = await CustomObject.create({ name: 'Project', label: 'Project', pluralLabel: 'Projects' });
      objectId = obj._id;
    });

    it('should delete custom object', async () => {
      const response = await request(app)
        .delete(`/api/admin/setup/objects/${objectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await CustomObject.findById(objectId);
      expect(deleted).toBeNull();
    });

    it('should not delete system objects', async () => {
      const obj = await CustomObject.create({ name: 'SystemObj', label: 'System', pluralLabel: 'Systems', isSystem: true });

      const response = await request(app)
        .delete(`/api/admin/setup/objects/${obj._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});