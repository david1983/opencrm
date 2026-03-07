import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Note from '../src/models/Note.js';

describe('Note Controller - Extended', () => {
  let app;
  let token;
  let userId;
  let adminToken;
  let adminId;
  let orgId;
  let accountId;

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
    await Account.deleteMany({});
    await Note.deleteMany({});

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

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    token = response.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/notes/:id', () => {
    let noteId;

    beforeEach(async () => {
      const note = await Note.create({
        title: 'Test Note',
        content: 'Test content',
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });
      noteId = note._id;
    });

    it('should return a single note', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Note');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });
  });

  describe('PUT /api/notes/:id', () => {
    let noteId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const note = await Note.create({
        title: 'Test Note',
        content: 'Test content',
        parentType: 'Account',
        parentId: accountId,
        owner: otherUserId,
        organization: orgId,
      });
      noteId = note._id;
    });

    it('should return 404 for non-existent note update', async () => {
      const response = await request(app)
        .put('/api/notes/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated', content: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 403 when updating another users note', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated', content: 'Updated' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to update this note');
    });

    it('should allow admin to update any note', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated', content: 'Admin content' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let noteId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const note = await Note.create({
        title: 'Test Note',
        content: 'Test content',
        parentType: 'Account',
        parentId: accountId,
        owner: otherUserId,
        organization: orgId,
      });
      noteId = note._id;
    });

    it('should return 404 for non-existent note delete', async () => {
      const response = await request(app)
        .delete('/api/notes/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 403 when deleting another users note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this note');
    });

    it('should allow admin to delete any note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Note.findById(noteId);
      expect(deleted).toBeNull();
    });
  });
});