import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import CustomObject from '../src/models/CustomObject.js';
import CustomField from '../src/models/CustomField.js';

describe('Custom Field - Additional Coverage', () => {
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

    const customObj = await CustomObject.create({
      name: 'Project',
      label: 'Project',
      pluralLabel: 'Projects',
      organization: orgId,
    });
    objectId = customObj._id;

    await CustomField.create({
      object: objectId,
      name: 'name',
      label: 'Name',
      type: 'Text',
      required: true,
      order: 0,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    adminToken = response.body.token;
  });

  describe('POST /api/admin/setup/objects/:objectId/fields - Edge Cases', () => {
    it('should create Number field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'amount',
          label: 'Amount',
          type: 'Number',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Number');
    });

    it('should create Date field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'due_date',
          label: 'Due Date',
          type: 'Date',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Date');
    });

    it('should create Boolean field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'is_active',
          label: 'Is Active',
          type: 'Boolean',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Boolean');
    });

    it('should create DateTime field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'created_at',
          label: 'Created At',
          type: 'DateTime',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('DateTime');
    });

    it('should create Email field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'email',
          label: 'Email',
          type: 'Email',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Email');
    });

    it('should create TextArea field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'description',
          label: 'Description',
          type: 'TextArea',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('TextArea');
    });

    it('should create Currency field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'price',
          label: 'Price',
          type: 'Currency',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Currency');
    });

    it('should create Percent field', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'discount',
          label: 'Discount',
          type: 'Percent',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Percent');
    });
  });

  describe('PUT /api/admin/setup/fields/:id - Updates', () => {
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

    it('should update field description', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should set field as required', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          required: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.required).toBe(true);
    });

    it('should set field as unique', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          unique: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.unique).toBe(true);
    });

    it('should set default value', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          defaultValue: 'Default text',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.defaultValue).toBe('Default text');
    });

    it('should deactivate field', async () => {
      const response = await request(app)
        .put(`/api/admin/setup/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          active: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.active).toBe(false);
    });
  });
});