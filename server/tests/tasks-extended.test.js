import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Task from '../src/models/Task.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';

describe('Task Controller - Extended', () => {
  let app;
  let token;
  let userId;
  let adminToken;
  let adminId;
  let orgId;
  let accountId;
  let contactId;

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
    await Task.deleteMany({});
    await Account.deleteMany({});
    await Contact.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });
    adminId = admin._id;

    const account = await Account.create({
      name: 'Test Account',
      owner: userId,
      organization: orgId,
    });
    accountId = account._id;

    const contact = await Contact.create({
      firstName: 'Test',
      lastName: 'Contact',
      email: 'contact@test.com',
      owner: userId,
      organization: orgId,
    });
    contactId = contact._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await Task.create([
        {
          subject: 'Task 1',
          owner: userId,
          organization: orgId,
          dueDate: new Date(),
          status: 'Not Started',
          priority: 'High',
          account: accountId,
        },
        {
          subject: 'Task 2',
          owner: userId,
          organization: orgId,
          dueDate: new Date(),
          status: 'In Progress',
          priority: 'Normal',
          contact: contactId,
        },
        {
          subject: 'Task 3',
          owner: userId,
          organization: orgId,
          dueDate: new Date(),
          status: 'Completed',
          priority: 'Low',
        },
      ]);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=Not Started')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(t => t.status === 'Not Started')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=High')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(t => t.priority === 'High')).toBe(true);
    });

    it('should filter tasks by contact', async () => {
      const response = await request(app)
        .get(`/api/tasks?contact=${contactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('should filter tasks by account', async () => {
      const response = await request(app)
        .get(`/api/tasks?account=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('should return pagination info', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        subject: 'Test Task',
        owner: userId,
        organization: orgId,
        dueDate: new Date(),
        status: 'Not Started',
      });
      taskId = task._id;
    });

    it('should return task details', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subject).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const task = await Task.create({
        subject: 'Original Task',
        owner: otherUserId,
        organization: orgId,
        dueDate: new Date(),
        status: 'Not Started',
      });
      taskId = task._id;
    });

    it('should return 404 for non-existent task update', async () => {
      const response = await request(app)
        .put('/api/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ subject: 'Updated', dueDate: '2024-12-31', status: 'In Progress' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 403 when updating another users task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ subject: 'Unauthorized Update', dueDate: '2024-12-31', status: 'In Progress' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this task');
    });

    it('should allow admin to update any task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ subject: 'Admin Updated', dueDate: '2024-12-31', status: 'In Progress' });

      expect(response.status).toBe(200);
      expect(response.body.data.subject).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const task = await Task.create({
        subject: 'Test Task',
        owner: otherUserId,
        organization: orgId,
        dueDate: new Date(),
        status: 'Not Started',
      });
      taskId = task._id;
    });

    it('should return 404 for non-existent task delete', async () => {
      const response = await request(app)
        .delete('/api/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 403 when deleting another users task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this task');
    });

    it('should allow admin to delete any task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Task.findById(taskId);
      expect(deleted).toBeNull();
    });
  });
});