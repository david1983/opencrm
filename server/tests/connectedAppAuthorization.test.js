import mongoose from 'mongoose';
import ConnectedAppAuthorization from '../src/models/ConnectedAppAuthorization.js';
import ConnectedApp from '../src/models/ConnectedApp.js';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

describe('ConnectedAppAuthorization Model', () => {
  let orgId;
  let userId;
  let appId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await ConnectedAppAuthorization.deleteMany({});
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

    const app = await ConnectedApp.create({
      name: 'Test App',
      organization: orgId,
      createdBy: userId,
      authType: 'oauth',
      clientId: 'test_client',
      clientSecretHash: 'hash',
      scopes: ['accounts:read'],
    });
    appId = app._id;
  });

  it('should create authorization with granted scopes', async () => {
    const auth = await ConnectedAppAuthorization.create({
      user: userId,
      connectedApp: appId,
      organization: orgId,
      accessTokenHash: 'hashed_token',
      refreshTokenHash: 'hashed_refresh',
      grantedScopes: ['accounts:read'],
      expiresAt: new Date(Date.now() + 3600000),
    });

    expect(auth.grantedScopes).toContain('accounts:read');
    expect(auth.isApiKey).toBe(false);
  });

  it('should enforce unique user-app combination', async () => {
    await ConnectedAppAuthorization.create({
      user: userId,
      connectedApp: appId,
      organization: orgId,
      grantedScopes: ['accounts:read'],
    });

    await expect(ConnectedAppAuthorization.create({
      user: userId,
      connectedApp: appId,
      organization: orgId,
      grantedScopes: ['contacts:read'],
    })).rejects.toThrow();
  });

  it('should create API key authorization', async () => {
    const auth = await ConnectedAppAuthorization.create({
      user: userId,
      connectedApp: appId,
      organization: orgId,
      isApiKey: true,
      grantedScopes: ['accounts:read', 'contacts:read'],
    });

    expect(auth.isApiKey).toBe(true);
  });
});