import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Note from '../src/models/Note.js';

describe('Note Controller', () => {
  let app;
  let token;
  let userId;
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
    // Clear collections
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Account.deleteMany({});
    await Note.deleteMany({});

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

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Meeting Notes',
          content: 'Discussed Q4 objectives with the team.',
          parentType: 'Account',
          parentId: accountId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Meeting Notes');
      expect(response.body.data.parentType).toBe('Account');
    });

    it('should require title and content', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          parentType: 'Account',
          parentId: accountId,
        });

      expect(response.status).toBe(400);
    });

    it('should require parent type and id', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Orphan Note',
          content: 'No parent',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/notes', () => {
    beforeEach(async () => {
      // Create test notes
      await Note.create([
        {
          title: 'Note 1',
          content: 'Content 1',
          parentType: 'Account',
          parentId: accountId,
          owner: userId,
          organization: orgId,
        },
        {
          title: 'Note 2',
          content: 'Content 2',
          parentType: 'Account',
          parentId: accountId,
          owner: userId,
          organization: orgId,
        },
      ]);
    });

    it('should return notes for parent entity', async () => {
      const response = await request(app)
        .get(`/api/notes?parentType=Account&parentId=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should require parent type and id', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/notes/:id', () => {
    let noteId;

    beforeEach(async () => {
      const note = await Note.create({
        title: 'Update Test',
        content: 'Original content',
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });
      noteId = note._id;
    });

    it('should update note', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.content).toBe('Updated content');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let noteId;

    beforeEach(async () => {
      const note = await Note.create({
        title: 'Delete Test',
        content: 'Content to delete',
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });
      noteId = note._id;
    });

    it('should delete note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify deleted
      const deleted = await Note.findById(noteId);
      expect(deleted).toBeNull();
    });
  });
});