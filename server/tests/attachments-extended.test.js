import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Attachment from '../src/models/Attachment.js';

describe('Attachment Controller - Extended', () => {
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
    await Attachment.deleteMany({});

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

  describe('GET /api/attachments/:id (file download)', () => {
    it('should return 404 for non-existent attachment download', async () => {
      const response = await request(app)
        .get('/api/attachments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/attachments/:id', () => {
    let attachmentId;
    let otherUserId;

    beforeEach(async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: 'password123',
        organization: orgId,
      });
      otherUserId = otherUser._id;

      const attachment = await Attachment.create({
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        content: Buffer.from('test content'),
        parentType: 'Account',
        parentId: accountId,
        owner: otherUserId,
        organization: orgId,
      });
      attachmentId = attachment._id;
    });

    it('should return 403 when deleting another users attachment', async () => {
      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to delete this attachment');
    });

    it('should allow admin to delete any attachment', async () => {
      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Attachment.findById(attachmentId);
      expect(deleted).toBeNull();
    });
  });

  describe('POST /api/attachments (file upload)', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .field('parentType', 'Account')
        .field('parentId', accountId.toString());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('should return 400 when parentType is missing', async () => {
      const response = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .field('parentId', accountId.toString());

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('parentType and parentId are required');
    });

    it('should return 400 when parentId is missing', async () => {
      const response = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .field('parentType', 'Account');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('parentType and parentId are required');
    });
  });

  describe('Attachment with URL redirect', () => {
    it('should return 404 when attachment has no content or url', async () => {
      // Create attachment without content or url
      const attachment = await Attachment.create({
        filename: 'external.pdf',
        originalName: 'external.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        // No content and no url
        parentType: 'Account',
        parentId: accountId,
        owner: userId,
        organization: orgId,
      });

      const response = await request(app)
        .get(`/api/attachments/${attachment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File content not found');
    });
  });
});