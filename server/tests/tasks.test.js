import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Task from '../src/models/Task.js';
import Contact from '../src/models/Contact.js';
import Account from '../src/models/Account.js';

describe('Task Controller', () => {
  let app;
  let token;
  let userId;
  let orgId;
  let contactId;
  let accountId;

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
    await Task.deleteMany({});
    await Contact.deleteMany({});
    await Account.deleteMany({});

    // Create organization
    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    // Create user
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;

    // Create account
    const account = await Account.create({
      name: 'Test Account',
      owner: userId,
      organization: orgId,
    });
    accountId = account._id;

    // Create contact
    const contact = await Contact.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      owner: userId,
      organization: orgId,
    });
    contactId = contact._id;

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Follow up call',
          description: 'Call the prospect',
          dueDate: '2024-01-20',
          priority: 'High',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subject).toBe('Follow up call');
      expect(response.body.data.status).toBe('Not Started');
    });

    it('should require subject and dueDate', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing subject and dueDate',
        });

      expect(response.status).toBe(400);
    });

    it('should create task with different priorities', async () => {
      const priorities = ['Low', 'Normal', 'High'];

      for (const priority of priorities) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .send({
            subject: `Task with ${priority} priority`,
            dueDate: '2024-01-20',
            priority,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.priority).toBe(priority);
      }
    });

    it('should create task with different statuses', async () => {
      const statuses = ['Not Started', 'In Progress', 'Completed', 'Deferred'];

      for (const status of statuses) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .send({
            subject: `Task with ${status} status`,
            dueDate: '2024-01-20',
            status,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe(status);
      }
    });
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
        },
        {
          subject: 'Task 2',
          owner: userId,
          organization: orgId,
          dueDate: new Date(),
          status: 'In Progress',
          priority: 'Normal',
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

    it('should return list of tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=Completed')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('Completed');
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=High')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('High');
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
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        subject: 'Update Task',
        owner: userId,
        organization: orgId,
        dueDate: new Date(),
      });
      taskId = task._id;
    });

    it('should update task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Updated Task',
          dueDate: '2024-01-25',
          status: 'In Progress',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.subject).toBe('Updated Task');
      expect(response.body.data.status).toBe('In Progress');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        subject: 'Delete Task',
        owner: userId,
        organization: orgId,
        dueDate: new Date(),
      });
      taskId = task._id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const deleted = await Task.findById(taskId);
      expect(deleted).toBeNull();
    });
  });
});