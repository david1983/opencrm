import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import ConnectedApp from '../src/models/ConnectedApp.js';
import ConnectedAppAuthorization from '../src/models/ConnectedAppAuthorization.js';
import { generateRefreshToken, hashToken, generateClientId, hashSecret } from '../src/utils/tokenUtils.js';

describe('OAuth Token Security', () => {
  let app;
  let appDoc, org, user;
  const clientSecret = 'test-secret-value-for-oauth';

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
    await ConnectedApp.deleteMany({});
    await ConnectedAppAuthorization.deleteMany({});

    org = await Organization.create({ name: 'Test Org' });
    user = await User.create({
      name: 'OAuth User', email: 'oauth@test.com',
      password: 'pass1234', organization: org._id,
    });

    appDoc = await ConnectedApp.create({
      name: 'Test OAuth App',
      authType: 'oauth',
      clientId: generateClientId(),
      clientSecretHash: await hashSecret(clientSecret),
      redirectUris: ['http://localhost/callback'],
      scopes: ['accounts:read'],
      organization: org._id,
      createdBy: user._id,
    });
  });

  it('should reject an expired refresh token', async () => {
    const refreshTokenValue = generateRefreshToken();
    await ConnectedAppAuthorization.create({
      user: user._id,
      connectedApp: appDoc._id,
      organization: org._id,
      refreshTokenHash: hashToken(refreshTokenValue),
      grantedScopes: ['accounts:read'],
      expiresAt: new Date(Date.now() - 1000), // already expired
    });

    const response = await request(app)
      .post('/api/oauth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenValue,
        client_id: appDoc.clientId,
        client_secret: clientSecret,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/expired/i);
  });

  it('should accept a valid (non-expired) refresh token', async () => {
    const refreshTokenValue = generateRefreshToken();
    await ConnectedAppAuthorization.create({
      user: user._id,
      connectedApp: appDoc._id,
      organization: org._id,
      refreshTokenHash: hashToken(refreshTokenValue),
      grantedScopes: ['accounts:read'],
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });

    const response = await request(app)
      .post('/api/oauth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenValue,
        client_id: appDoc.clientId,
        client_secret: clientSecret,
      });

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBeDefined();
    expect(response.body.refresh_token).toBeDefined();
  });
});
