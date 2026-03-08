import { google } from 'googleapis';
import BaseProvider from './BaseProvider.js';

class GoogleDriveProvider extends BaseProvider {
  constructor(credentials) {
    super(credentials);
    this.drive = this.createDriveClient();
  }

  createDriveClient() {
    const oauth2Client = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: this.credentials.refreshToken,
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  get name() {
    return 'google';
  }

  async testConnection() {
    try {
      await this.drive.about.get({ fields: 'user' });
      return true;
    } catch (error) {
      throw new Error(`Google Drive connection failed: ${error.message}`);
    }
  }

  async ensureFolder(path) {
    const parts = path.split('/').filter(Boolean);
    let parentId = null;

    for (const part of parts) {
      const query = parentId
        ? `name='${part}' and '${parentId}' in parents and trashed=false`
        : `name='${part}' and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      if (response.data.files.length > 0) {
        parentId = response.data.files[0].id;
      } else {
        const createResponse = await this.drive.files.create({
          requestBody: {
            name: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined,
          },
          fields: 'id',
        });
        parentId = createResponse.data.id;
      }
    }

    return parentId;
  }

  async upload(path, file, options = {}) {
    try {
      await this.testConnection();

      const folderId = await this.ensureFolder(path);
      const safeFilename = this.sanitizeFilename(file.originalname);

      const response = await this.drive.files.create({
        requestBody: {
          name: safeFilename,
          parents: [folderId],
        },
        media: {
          mimeType: file.mimetype,
          body: file.stream || file.buffer,
        },
        fields: 'id, webViewLink, thumbnailLink',
      });

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        thumbnailLink: response.data.thumbnailLink,
      };
    } catch (error) {
      throw new Error(`Google Drive upload failed: ${error.message}`);
    }
  }

  async download(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, { responseType: 'stream' });

      return response.data;
    } catch (error) {
      throw new Error(`Google Drive download failed: ${error.message}`);
    }
  }

  async delete(fileId) {
    try {
      await this.drive.files.delete({ fileId });
      return true;
    } catch (error) {
      throw new Error(`Google Drive delete failed: ${error.message}`);
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, size, mimeType, webViewLink, thumbnailLink',
      });

      return {
        id: response.data.id,
        name: response.data.name,
        size: parseInt(response.data.size, 10),
        mimeType: response.data.mimeType,
        webViewLink: response.data.webViewLink,
        thumbnailLink: response.data.thumbnailLink,
      };
    } catch (error) {
      throw new Error(`Google Drive getFileInfo failed: ${error.message}`);
    }
  }

  async refreshToken() {
    try {
      const oauth2Client = this.drive.context._options.auth;
      const { credentials } = await oauth2Client.refreshAccessToken();
      this.credentials.accessToken = credentials.access_token;
      return credentials;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }
}

export default GoogleDriveProvider;