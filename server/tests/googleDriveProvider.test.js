import GoogleDriveProvider from '../src/services/cloud-storage/GoogleDriveProvider.js';

describe('GoogleDriveProvider', () => {
  const mockCredentials = {
    clientId: 'test-client-id',
    clientSecret: 'test-secret',
    refreshToken: 'test-refresh-token',
  };

  it('should create provider instance', () => {
    const provider = new GoogleDriveProvider(mockCredentials);
    expect(provider.name).toBe('google');
  });

  it('should sanitize filenames', () => {
    const provider = new GoogleDriveProvider(mockCredentials);
    // BaseProvider replaces / with _ and removes leading dots
    expect(provider.sanitizeFilename('../../../etc/passwd')).toBe('_.._.._etc_passwd');
    expect(provider.sanitizeFilename('file<name>.txt')).toBe('file_name_.txt');
  });

  it('should generate correct path', () => {
    const provider = new GoogleDriveProvider(mockCredentials);
    const path = provider.generatePath('Account', 'ABC Corp');
    expect(path).toMatch(/\/OpenCRM\/Accounts\/ABC Corp\/\d{4}\/\d{2}/);
  });
});