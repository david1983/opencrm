import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';
import Lead from '../src/models/Lead.js';
import Opportunity from '../src/models/Opportunity.js';

describe('IDOR Prevention — single-entity GET endpoints', () => {
  let app;
  let user1Token, user2Token;
  let org1Id, user1Id, user2Id;

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
    await Contact.deleteMany({});
    await Lead.deleteMany({});
    await Opportunity.deleteMany({});

    const org1 = await Organization.create({ name: 'Org 1' });
    org1Id = org1._id;

    const u1 = await User.create({
      name: 'User 1', email: 'u1@test.com', password: 'pass1234', organization: org1._id,
    });
    user1Id = u1._id;

    const u2 = await User.create({
      name: 'User 2', email: 'u2@test.com', password: 'pass1234', organization: org1._id,
    });
    user2Id = u2._id;

    const r1 = await request(app).post('/api/auth/login').send({ email: 'u1@test.com', password: 'pass1234' });
    user1Token = r1.body.token;

    const r2 = await request(app).post('/api/auth/login').send({ email: 'u2@test.com', password: 'pass1234' });
    user2Token = r2.body.token;
  });

  it('should not allow user2 to GET an account owned by user1', async () => {
    const account = await Account.create({ name: 'Secret Corp', owner: user1Id, organization: org1Id });

    const response = await request(app)
      .get(`/api/accounts/${account._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });

  it('should allow user1 to GET their own account', async () => {
    const account = await Account.create({ name: 'My Corp', owner: user1Id, organization: org1Id });

    const response = await request(app)
      .get(`/api/accounts/${account._id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('My Corp');
  });

  it('should not allow user2 to GET a contact owned by user1', async () => {
    const contact = await Contact.create({
      firstName: 'Secret', lastName: 'Person', email: 'secret@test.com',
      owner: user1Id, organization: org1Id,
    });

    const response = await request(app)
      .get(`/api/contacts/${contact._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });

  it('should not allow user2 to GET a lead owned by user1', async () => {
    const lead = await Lead.create({
      firstName: 'Secret', lastName: 'Lead', email: 'slead@test.com',
      owner: user1Id, organization: org1Id,
    });

    const response = await request(app)
      .get(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });

  it('should not allow user2 to GET an opportunity owned by user1', async () => {
    const account = await Account.create({ name: 'Acme', owner: user1Id, organization: org1Id });
    const opp = await Opportunity.create({
      name: 'Secret Deal', stage: 'Prospecting', closeDate: new Date(),
      owner: user1Id, organization: org1Id, account: account._id,
    });

    const response = await request(app)
      .get(`/api/opportunities/${opp._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });
});
