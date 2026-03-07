import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Organization from '../src/models/Organization.js';

describe('Role Controller', () => {
  let app;
  let adminToken;
  let userToken;
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
    await Role.deleteMany({});
    await Organization.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });

    await User.create({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
      organization: orgId,
    });

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminRes.body.token;

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    userToken = userRes.body.token;
  });

  describe('GET /api/admin/roles', () => {
    it('should list roles for admin', async () => {
      await Role.create({
        name: 'Sales Rep',
        organization: orgId,
        permissions: [{ module: 'accounts', actions: ['view', 'edit'] }],
      });

      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should deny access for non-admin', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/admin/roles', () => {
    it('should create new role', async () => {
      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sales Manager',
          description: 'Manages sales team',
          permissions: [
            { module: 'accounts', actions: ['view', 'edit', 'create'] },
            { module: 'contacts', actions: ['view', 'edit', 'create'] },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Sales Manager');
    });

    it('should not create duplicate role names', async () => {
      await Role.create({
        name: 'Sales Rep',
        organization: orgId,
      });

      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sales Rep',
          permissions: [{ module: 'accounts', actions: ['view'] }],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/roles/:id', () => {
    it('should update role', async () => {
      const role = await Role.create({
        name: 'Test Role',
        organization: orgId,
        permissions: [{ module: 'accounts', actions: ['view'] }],
      });

      const response = await request(app)
        .put(`/api/admin/roles/${role._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
          permissions: [
            { module: 'accounts', actions: ['view', 'edit'] },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/admin/roles/:id', () => {
    it('should delete custom role', async () => {
      const role = await Role.create({
        name: 'Deletable Role',
        organization: orgId,
        isSystem: false,
      });

      const response = await request(app)
        .delete(`/api/admin/roles/${role._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should not delete system role', async () => {
      const role = await Role.create({
        name: 'System Role',
        organization: orgId,
        isSystem: true,
      });

      const response = await request(app)
        .delete(`/api/admin/roles/${role._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});