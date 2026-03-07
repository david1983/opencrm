import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

// Helper to create test user and organization
export async function createTestUser() {
  const organization = await Organization.create({ name: 'Test Org' });

  const user = await User.create({
    name: 'Test User',
    email: `test${Date.now()}@test.com`,
    password: 'password123',
    organization: organization._id,
  });

  return { user, organization };
}

// Helper to get auth token
export async function getAuthToken(app, user) {
  const response = await app
    .post('/api/auth/login')
    .send({ email: user.email, password: 'password123' });

  return response.body.token;
}

// Clear all collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});