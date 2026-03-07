import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Lead from '../src/models/Lead.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';
import Opportunity from '../src/models/Opportunity.js';

describe('Lead Conversion', () => {
  let app;
  let token;
  let userId;
  let orgId;
  let leadId;

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
    await Lead.deleteMany({});
    await Account.deleteMany({});
    await Contact.deleteMany({});
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

    // Create a lead
    const lead = await Lead.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Acme Inc',
      owner: userId,
      organization: orgId,
      status: 'Qualified',
      source: 'Website',
    });
    leadId = lead._id;

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  describe('POST /api/leads/:id/convert', () => {
    it('should convert lead to contact, account, and opportunity', async () => {
      const response = await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          createAccount: true,
          accountName: 'Acme Inc',
          createOpportunity: true,
          opportunityName: 'New Opportunity',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lead.status).toBe('Converted');
      expect(response.body.data.contact).toBeDefined();
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.opportunity).toBeDefined();
    });

    it('should convert lead to contact only', async () => {
      const response = await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          createAccount: false,
          createOpportunity: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contact).toBeDefined();
      expect(response.body.data.account).toBeNull();
      expect(response.body.data.opportunity).toBeNull();
    });

    it('should return 400 for already converted lead', async () => {
      // First conversion
      await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          createAccount: false,
          createOpportunity: false,
        });

      // Second conversion attempt
      const response = await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          createAccount: false,
          createOpportunity: false,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Lead has already been converted');
    });

    it('should return 404 for non-existent lead', async () => {
      const response = await request(app)
        .post('/api/leads/507f1f77bcf86cd799439011/convert')
        .set('Authorization', `Bearer ${token}`)
        .send({
          createAccount: false,
          createOpportunity: false,
        });

      expect(response.status).toBe(404);
    });
  });
});