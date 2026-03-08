import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import CustomObject from '../src/models/CustomObject.js';
import CustomField from '../src/models/CustomField.js';

describe('Custom Field Controller - Extended', () => {
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

    // Create default name field
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

  describe('POST /api/admin/setup/objects/:objectId/fields', () => {
    it('should return 404 for non-existent object', async () => {
      const response = await request(app)
        .post('/api/admin/setup/objects/507f1f77bcf86cd799439011/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: '507f1f77bcf86cd799439011',
          name: 'test_field',
          label: 'Test Field',
          type: 'Text',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Object not found');
    });

    it('should return 400 for duplicate field name', async () => {
      await CustomField.create({
        object: objectId,
        name: 'existing_field',
        label: 'Existing Field',
        type: 'Text',
      });

      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'existing_field',
          label: 'Another Field',
          type: 'Text',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Field with this name already exists for this object');
    });

    it('should create field with options for Picklist type', async () => {
      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'status',
          label: 'Status',
          type: 'Picklist',
          options: [
            { value: 'Open', label: 'Open' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Closed', label: 'Closed' }
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Picklist');
      expect(response.body.data.options).toHaveLength(3);
    });

    it('should create Lookup field with lookupObject', async () => {
      // Create another custom object to reference
      const accountObj = await CustomObject.create({
        name: 'Account',
        label: 'Account',
        pluralLabel: 'Accounts',
        organization: orgId,
      });

      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'related_account',
          label: 'Related Account',
          type: 'Lookup',
          lookupObject: accountObj._id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('Lookup');
      expect(response.body.data.lookupObject).toBeDefined();
    });

    it('should set order automatically', async () => {
      // First field has order 0, next should be 1
      await CustomField.create({
        object: objectId,
        name: 'field1',
        label: 'Field 1',
        type: 'Text',
        order: 1,
      });

      const response = await request(app)
        .post(`/api/admin/setup/objects/${objectId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          object: objectId,
          name: 'field2',
          label: 'Field 2',
          type: 'Text',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.order).toBe(2);
    });
  });

  describe('GET /api/admin/setup/fields/:id', () => {
    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .get('/api/admin/setup/fields/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Field not found');
    });
  });

  describe('DELETE /api/admin/setup/fields/:id', () => {
    it('should not delete name field (system field)', async () => {
      // Find the default name field
      const nameField = await CustomField.findOne({ object: objectId, name: 'name' });

      const response = await request(app)
        .delete(`/api/admin/setup/fields/${nameField._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot delete the name field');
    });

    it('should delete regular fields', async () => {
      const field = await CustomField.create({
        object: objectId,
        name: 'deletable_field',
        label: 'Deletable Field',
        type: 'Text',
      });

      const response = await request(app)
        .delete(`/api/admin/setup/fields/${field._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await CustomField.findById(field._id);
      expect(deleted).toBeNull();
    });
  });

  describe('PUT /api/admin/setup/fields/:id', () => {
    it('should update field options for Picklist', async () => {
      const field = await CustomField.create({
        object: objectId,
        name: 'status',
        label: 'Status',
        type: 'Picklist',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'Closed', label: 'Closed' }
        ],
      });

      const response = await request(app)
        .put(`/api/admin/setup/fields/${field._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          label: 'Updated Status',
          options: [
            { value: 'Open', label: 'Open' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Closed', label: 'Closed' },
            { value: 'Cancelled', label: 'Cancelled' }
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.label).toBe('Updated Status');
    });

    it('should update Lookup field with new lookupObject', async () => {
      const accountObj = await CustomObject.create({
        name: 'Account',
        label: 'Account',
        pluralLabel: 'Accounts',
        organization: orgId,
      });

      const field = await CustomField.create({
        object: objectId,
        name: 'related',
        label: 'Related',
        type: 'Lookup',
        lookupObject: accountObj._id,
      });

      const contactObj = await CustomObject.create({
        name: 'Contact',
        label: 'Contact',
        pluralLabel: 'Contacts',
        organization: orgId,
      });

      const response = await request(app)
        .put(`/api/admin/setup/fields/${field._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lookupObject: contactObj._id,
        });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/setup/objects/:objectId/fields/reorder', () => {
    it('should reorder fields', async () => {
      const field1 = await CustomField.create({
        object: objectId,
        name: 'field_a',
        label: 'Field A',
        type: 'Text',
        order: 1,
      });
      const field2 = await CustomField.create({
        object: objectId,
        name: 'field_b',
        label: 'Field B',
        type: 'Text',
        order: 2,
      });
      const field3 = await CustomField.create({
        object: objectId,
        name: 'field_c',
        label: 'Field C',
        type: 'Text',
        order: 3,
      });

      const nameField = await CustomField.findOne({ object: objectId, name: 'name' });

      // Reverse order (excluding name field)
      const newOrder = [field3._id.toString(), field2._id.toString(), field1._id.toString()];

      const response = await request(app)
        .put(`/api/admin/setup/objects/${objectId}/fields/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fieldOrder: newOrder });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fields reordered successfully');
    });
  });

  describe('GET /api/admin/setup/field-types', () => {
    it('should return all available field types', async () => {
      const response = await request(app)
        .get('/api/admin/setup/field-types')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('Text');
      expect(response.body.data).toContain('Number');
      expect(response.body.data).toContain('Boolean');
      expect(response.body.data).toContain('Picklist');
    });
  });
});