import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Attachment from '../src/models/Attachment.js';

describe('Attachment Controller', () => {
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
    await Attachment.deleteMany({});

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

  describe('GET /api/attachments', () => {
    it('should require parentType and parentId', async () => {
      const response = await request(app)
        .get('/api/attachments')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('should return attachments for a parent entity', async () => {
      // Create an attachment first
      await Attachment.create({
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });

      const response = await request(app)
        .get(`/api/attachments?parentType=Account&parentId=${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('GET /api/attachments/:id', () => {
    let attachmentId;

    beforeEach(async () => {
      const attachment = await Attachment.create({
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });
      attachmentId = attachment._id;
    });

    it('should return attachment metadata', async () => {
      const response = await request(app)
        .get(`/api/attachments/${attachmentId}?meta=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.originalName).toBe('test.pdf');
    });

    it('should return 404 for non-existent attachment', async () => {
      const response = await request(app)
        .get('/api/attachments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/attachments/:id', () => {
    let attachmentId;

    beforeEach(async () => {
      const attachment = await Attachment.create({
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });
      attachmentId = attachment._id;
    });

    it('should delete attachment', async () => {
      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const deleted = await Attachment.findById(attachmentId);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent attachment', async () => {
      const response = await request(app)
        .delete('/api/attachments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});