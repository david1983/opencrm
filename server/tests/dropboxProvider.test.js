import DropboxProvider from '../src/services/cloud-storage/DropboxProvider.js';

describe('DropboxProvider', () => {
  const mockCredentials = {
    accessToken: 'test-access-token',
  };

  it('should create provider instance', () => {
    const provider = new DropboxProvider(mockCredentials);
    expect(provider.name).toBe('dropbox');
  });

  it('should sanitize filenames', () => {
    const provider = new DropboxProvider(mockCredentials);
    expect(provider.sanitizeFilename('file/name.txt')).toBe('file_name.txt');
    expect(provider.sanitizeFilename('file<>name.txt')).toBe('file__name.txt');
  });

  it('should generate correct path', () => {
    const provider = new DropboxProvider(mockCredentials);
    const path = provider.generatePath('Lead', 'John Smith');
    expect(path).toMatch(/\/OpenCRM\/Leads\/John Smith\/\d{4}\/\d{2}/);
  });
});