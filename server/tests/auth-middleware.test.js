import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Auth Middleware - deleted user', () => {
  let app;

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
  });

  it('should return 401 when user no longer exists in database', async () => {
    const org = await Organization.create({ name: 'Test Org' });
    const user = await User.create({
      name: 'Ghost User',
      email: 'ghost@example.com',
      password: 'password123',
      organization: org._id,
    });

    // Generate a valid token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Delete the user (simulates account deletion)
    await User.deleteOne({ _id: user._id });

    // Token is valid but user is gone — should get 401, not crash
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/no longer exists/i);
  });
});
