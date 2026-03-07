import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';
import Lead from '../src/models/Lead.js';
import Opportunity from '../src/models/Opportunity.js';

describe('Search Controller', () => {
  let app;
  let token;
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
    await Account.deleteMany({});
    await Contact.deleteMany({});
    await Lead.deleteMany({});
    await Opportunity.deleteMany({});

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

    // Create test data with searchable names
    await Account.create([
      { name: 'Acme Corporation', owner: userId, organization: orgId },
      { name: 'Globex Industries', owner: userId, organization: orgId },
    ]);

    await Contact.create([
      { firstName: 'John', lastName: 'Smith', email: 'john@acme.com', owner: userId, organization: orgId },
      { firstName: 'Jane', lastName: 'Doe', email: 'jane@globex.com', owner: userId, organization: orgId },
    ]);

    await Lead.create([
      { firstName: 'Mike', lastName: 'Johnson', email: 'mike@test.com', owner: userId, organization: orgId, status: 'New' },
    ]);

    await Opportunity.create([
      { name: 'Acme Deal', owner: userId, organization: orgId, stage: 'Prospecting', closeDate: new Date() },
      { name: 'Globex Opportunity', owner: userId, organization: orgId, stage: 'Proposal', closeDate: new Date() },
    ]);

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('GET /api/search', () => {
    it('should search across all entities', async () => {
      const response = await request(app)
        .get('/api/search?q=Acme')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accounts).toBeDefined();
      expect(response.body.data.contacts).toBeDefined();
    });

    it('should return results for matching query', async () => {
      const response = await request(app)
        .get('/api/search?q=John')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // Should find John Smith contact
      expect(response.body.data.contacts.length).toBeGreaterThan(0);
    });

    it('should return empty results for no matches', async () => {
      const response = await request(app)
        .get('/api/search?q=NonExistentEntity')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.accounts).toEqual([]);
      expect(response.body.data.contacts).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/search?q=test');

      expect(response.status).toBe(401);
    });

    it('should return empty results for short query', async () => {
      const response = await request(app)
        .get('/api/search?q=a')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.accounts).toEqual([]);
    });
  });
});