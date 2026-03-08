class BaseProvider {
  constructor(credentials) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is an abstract class and cannot be instantiated directly');
    }
    this.credentials = credentials;
  }

  // Core operations - must be implemented by subclasses
  async upload(path, file, options) {
    throw new Error('upload() must be implemented by subclass');
  }

  async download(fileId) {
    throw new Error('download() must be implemented by subclass');
  }

  async delete(fileId) {
    throw new Error('delete() must be implemented by subclass');
  }

  async getFileInfo(fileId) {
    throw new Error('getFileInfo() must be implemented by subclass');
  }

  // Auth
  async refreshToken() {
    throw new Error('refreshToken() must be implemented by subclass');
  }

  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  // Metadata
  get name() {
    throw new Error('name getter must be implemented by subclass');
  }

  // Shared utilities
  sanitizeFilename(filename) {
    // Remove path traversal characters and unsafe characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/^\.+/, '')
      .substring(0, 255);
  }

  generatePath(entityType, entityName) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const safeName = this.sanitizeFilename(entityName);
    return `/OpenCRM/${entityType}s/${safeName}/${year}/${month}`;
  }
}

export default BaseProvider;