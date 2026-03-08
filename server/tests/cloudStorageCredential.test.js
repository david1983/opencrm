import mongoose from 'mongoose';
import CloudStorageCredential from '../src/models/CloudStorageCredential.js';

describe('CloudStorageCredential Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await CloudStorageCredential.deleteMany({});
  });

  it('should create a Google Drive credential', async () => {
    const cred = await CloudStorageCredential.create({
      provider: 'google',
      organization: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      credentials: {
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        refreshToken: 'test-refresh-token',
      },
    });

    expect(cred.provider).toBe('google');
    expect(cred.status).toBe('active');
    expect(cred.credentials.refreshToken).toBe('test-refresh-token');
  });

  it('should create a Dropbox credential', async () => {
    const cred = await CloudStorageCredential.create({
      provider: 'dropbox',
      organization: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      credentials: {
        accessToken: 'test-access-token',
      },
    });

    expect(cred.provider).toBe('dropbox');
    expect(cred.status).toBe('active');
  });

  it('should only allow one credential per org per provider', async () => {
    const orgId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await CloudStorageCredential.create({
      provider: 'google',
      organization: orgId,
      createdBy: userId,
      credentials: { refreshToken: 'token1' },
    });

    await expect(CloudStorageCredential.create({
      provider: 'google',
      organization: orgId,
      createdBy: userId,
      credentials: { refreshToken: 'token2' },
    })).rejects.toThrow();
  });
});