import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Admin User Controller', () => {
  let app;
  let adminToken;
  let adminId;
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

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });
    adminId = admin._id;

    // Create regular user
    const user = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    // Login as admin
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    adminToken = response.body.token;
  });

  describe('GET /api/admin/users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Admin User');
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].role).toBe('admin');
    });

    it('should return pagination info', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Regular User');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          role: 'admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should prevent duplicate email', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@test.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await User.findById(userId);
      expect(deleted).toBeNull();
    });

    it('should prevent deleting own account', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('should reset user password', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should require password', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should require password of at least 6 characters', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: '123' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/users — organization isolation', () => {
    it('should only return users from the same organization', async () => {
      // Create a second org with its own user
      const org2 = await Organization.create({ name: 'Org 2' });
      await User.create({
        name: 'Other Org User',
        email: 'other@org2.com',
        password: 'password123',
        organization: org2._id,
        role: 'user',
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const emails = response.body.data.map(u => u.email);
      expect(emails).not.toContain('other@org2.com');
    });
  });
});