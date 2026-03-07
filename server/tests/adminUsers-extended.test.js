import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Admin User Controller - Extended', () => {
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
    await User.deleteMany({});
    await Organization.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });
    adminId = admin._id;

    const user = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = response.body.token;
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should return 404 for non-existent user update', async () => {
      const response = await request(app)
        .put('/api/admin/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should update user name', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should update user role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('admin');
    });

    it('should update user avatar', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ avatar: 'https://example.com/avatar.png' });

      expect(response.status).toBe(200);
      expect(response.body.data.avatar).toBe('https://example.com/avatar.png');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should return 404 for non-existent user delete', async () => {
      const response = await request(app)
        .delete('/api/admin/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should prevent deleting your own account', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot delete your own account');
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('should return 404 for non-existent user password reset', async () => {
      const response = await request(app)
        .post('/api/admin/users/507f1f77bcf86cd799439011/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should reset password successfully', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'newpassword123' });

      expect(loginResponse.status).toBe(200);
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

  describe('GET /api/admin/users/active', () => {
    it('should return active user count', async () => {
      const response = await request(app)
        .get('/api/admin/users/active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2); // admin + regular user
    });
  });
});