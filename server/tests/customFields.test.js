import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import CustomObject from '../src/models/CustomObject.js';
import CustomField from '../src/models/CustomField.js';

describe('Custom Field Controller', () => {
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

    // Create custom object
    const customObj = await CustomObject.create({
      name: 'Project',
      label: 'Project',
      pluralLabel: 'Projects',
    });
    objectId = customObj._id;

    // Login as admin
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    adminToken = response.body.token;
  });

  describe('POST /api/admin/setup/objects/:objectId/fields', () => {
    it('should create a custom field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'status',
          label: 'Status',
          type: 'Text',
          required: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('status');
    });

    it('should create different field types', async () => {
      const types = ['Text', 'Number', 'Date', 'Checkbox', 'Email'];

      for (const type of types) {
        const response = await request(app)
          .post(`/api/admin/setup/objects/${objectId}/fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            object: objectId,
            name: `field_${type.toLowerCase()}_${Date.now()}`,
            label: `${type} Field`,
            type,
          });

        expect(response.status).toBe(201);
      }
    });
  });

  describe('GET /api/admin/setup/objects/:objectId/fields', () => {
    beforeEach(async () => {
      await CustomField.create([
        { object: objectId, name: 'field1', label: 'Field 1', type: 'Text', order: 1 },
        { object: objectId, name: 'field2', label: 'Field 2', type: 'Number', order: 2 },
      ]);
    });

    it('should return list of fields for object', async () => {
      const response = await request(app)
        .get(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3); // 2 created + default name field
    });
  });

  describe('GET /api/admin/setup/fields/:id', () => {
    let fieldId;

    beforeEach(async () => {
      const field = await CustomField.create({
        object: objectId,
        name: 'test_field',
        label: 'Test Field',
        type: 'Text',
      });
      fieldId = field._id;
    });

    it('should return field details', async () => {
      const response = await request(app)
        .get(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('test_field');
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .get('/api/admin/setup/fields/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/setup/fields/:id', () => {
    let fieldId;

    beforeEach(async () => {
      const field = await CustomField.create({
        object: objectId,
        name: 'test_field',
        label: 'Test Field',
        type: 'Text',
      });
      fieldId = field._id;
    });

    it('should update field', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          label: 'Updated Field',
          required: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.label).toBe('Updated Field');
    });
  });

  describe('DELETE /api/admin/setup/fields/:id', () => {
    let fieldId;

    beforeEach(async () => {
      const field = await CustomField.create({
        object: objectId,
        name: 'test_field',
        label: 'Test Field',
        type: 'Text',
      });
      fieldId = field._id;
    });

    it('should delete field', async () => {
      const response = await request(app)
        .delete(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await CustomField.findById(fieldId);
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/admin/setup/field-types', () => {
    it('should return available field types', async () => {
      const response = await request(app)
        .get('/api/admin/setup/field-types')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});