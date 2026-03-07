import mongoose from 'mongoose';
import ConnectedApp from '../src/models/ConnectedApp.js';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

describe('ConnectedApp Model', () => {
  let orgId;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await ConnectedApp.deleteMany({});
    await Organization.deleteMany({});
    await User.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      organization: orgId,
    });
    userId = user._id;
  });

  it('should create OAuth connected app', async () => {
    const app = await ConnectedApp.create({
      name: 'My OAuth App',
      description: 'Test OAuth application',
      organization: orgId,
      createdBy: userId,
      clientId: 'client_123',
      clientSecretHash: 'hashed_secret',
      redirectUris: ['http://localhost:3000/callback'],
      scopes: ['accounts:read', 'contacts:read'],
      authType: 'oauth',
    });

    expect(app.name).toBe('My OAuth App');
    expect(app.authType).toBe('oauth');
    expect(app.clientId).toBe('client_123');
    expect(app.isActive).toBe(true);
  });

  it('should create API key connected app', async () => {
    const app = await ConnectedApp.create({
      name: 'My API App',
      description: 'Test API key application',
      organization: orgId,
      createdBy: userId,
      apiKeyHash: 'hashed_key',
      apiKeyPrefix: 'ca_live_abc',
      scopes: ['accounts:read', 'contacts:write'],
      authType: 'apikey',
    });

    expect(app.authType).toBe('apikey');
    expect(app.apiKeyPrefix).toBe('ca_live_abc');
  });

  it('should enforce unique clientId', async () => {
    await ConnectedApp.create({
      name: 'App 1',
      organization: orgId,
      createdBy: userId,
      clientId: 'unique_client_id',
      authType: 'oauth',
    });

    await expect(ConnectedApp.create({
      name: 'App 2',
      organization: orgId,
      createdBy: userId,
      clientId: 'unique_client_id',
      authType: 'oauth',
    })).rejects.toThrow();
  });

  it('should default rate limit to 1000', async () => {
    const app = await ConnectedApp.create({
      name: 'Test App',
      organization: orgId,
      createdBy: userId,
      authType: 'apikey',
      apiKeyHash: 'hash',
      apiKeyPrefix: 'ca_test',
    });

    expect(app.rateLimit).toBe(1000);
  });
});