import { Dropbox } from 'dropbox';
import BaseProvider from './BaseProvider.js';

class DropboxProvider extends BaseProvider {
  constructor(credentials) {
    super(credentials);
    this.dbx = new Dropbox({ accessToken: credentials.accessToken });
  }

  get name() {
    return 'dropbox';
  }

  async testConnection() {
    try {
      await this.dbx.usersGetCurrentAccount();
      return true;
    } catch (error) {
      throw new Error(`Dropbox connection failed: ${error.message}`);
    }
  }

  async ensureFolder(path) {
    try {
      await this.dbx.filesCreateFolderV2({ path });
      return path;
    } catch (error) {
      if (error.error && error.error.error_summary &&
          error.error.error_summary.startsWith('conflict')) {
        // Folder already exists
        return path;
      }
      throw error;
    }
  }

  async upload(path, file, options = {}) {
    try {
      await this.testConnection();

      // Ensure folder exists
      await this.ensureFolder(path);

      const safeFilename = this.sanitizeFilename(file.originalname);
      const fullPath = `${path}/${safeFilename}`;

      const response = await this.dbx.filesUpload({
        path: fullPath,
        contents: file.buffer,
        mode: { '.tag': 'add' },
        autorename: true,
      });

      // Create shared link for viewing
      let sharedLink;
      try {
        const linkResponse = await this.dbx.sharingCreateSharedLinkWithSettings({
          path: response.data.path_lower,
        });
        sharedLink = linkResponse.data.url;
      } catch {
        // Shared link might already exist
        sharedLink = null;
      }

      return {
        fileId: response.data.id,
        webViewLink: sharedLink,
        thumbnailLink: null, // Dropbox doesn't provide thumbnail links directly
      };
    } catch (error) {
      throw new Error(`Dropbox upload failed: ${error.message}`);
    }
  }

  async download(fileId) {
    try {
      const response = await this.dbx.filesDownload({ path: fileId });
      return response.data.fileBinary;
    } catch (error) {
      throw new Error(`Dropbox download failed: ${error.message}`);
    }
  }

  async delete(fileId) {
    try {
      await this.dbx.filesDeleteV2({ path: fileId });
      return true;
    } catch (error) {
      throw new Error(`Dropbox delete failed: ${error.message}`);
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await this.dbx.filesGetMetadata({ path: fileId });

      return {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        mimeType: response.data['.tag'] === 'file' ? 'application/octet-stream' : null,
        webViewLink: null,
        thumbnailLink: null,
      };
    } catch (error) {
      throw new Error(`Dropbox getFileInfo failed: ${error.message}`);
    }
  }

  async refreshToken() {
    // Dropbox uses long-lived tokens, no refresh needed for basic auth
    // For OAuth flow, would need app key/secret
    return { accessToken: this.credentials.accessToken };
  }
}

export default DropboxProvider;