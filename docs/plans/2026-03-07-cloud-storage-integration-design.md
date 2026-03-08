# Cloud Storage Integration for Attachments - Design Document

> **Created:** 2026-03-07
> **Status:** Approved

## Overview

Add Google Drive and Dropbox as cloud storage backends for CRM attachments. Admins configure organization-wide credentials, files are uploaded through the CRM UI and stored in cloud storage with entity/date organization, and a database index enables fast lookups.

## Goals

- **Offload storage costs** - Let Google/Dropbox handle large files instead of local server storage
- **Enable collaboration** - Users can link files stored in their cloud drives
- **Mobile access** - Users can access attachments from anywhere through cloud providers

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CRM Frontend                            │
│  Upload UI → Progress indicator → File list with thumbnails │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  POST /api/attachments/upload                               │
│  GET  /api/attachments/:id                                   │
│  GET  /api/admin/cloud-storage/settings                     │
│  POST /api/admin/cloud-storage/credentials                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Cloud Storage Service Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Upload Queue │  │ Retry Logic  │  │ Metadata DB  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                              │                               │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼              │
│       ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│       │ Google   │    │ Dropbox  │    │ (future) │          │
│       │ Drive API│    │ API      │    │ S3/OneDr│          │
│       └──────────┘    └──────────┘    └──────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Interaction model | Upload through CRM | Simplest UX, CRM controls organization |
| Storage organization | Organization folder | Shared across all org users |
| Providers | Both Google Drive and Dropbox | Build abstraction layer from start |
| Auth | Server-side credentials | Admin manages, transparent to users |
| Error handling | Queue & retry with backoff | Robust handling of transient failures |
| File organization | Entity + date folders | `/OpenCRM/Accounts/ABC Corp/2024/03/` |

## Data Models

### CloudStorageCredential (new)

```javascript
{
  organization: ObjectId,      // Which org owns this
  provider: 'google' | 'dropbox',
  credentials: {               // Encrypted at rest (AES-256-GCM)
    // Google: { clientId, clientSecret, refreshToken }
    // Dropbox: { appKey, appSecret, accessToken }
  },
  status: 'active' | 'expired' | 'error',
  lastUsed: Date,
  createdBy: ObjectId          // Admin who set it up
}
```

### UploadQueue (new)

```javascript
{
  organization: ObjectId,
  attachment: ObjectId,
  provider: 'google' | 'dropbox',
  status: 'pending' | 'uploading' | 'completed' | 'failed',
  attempts: Number,
  maxAttempts: Number,         // Default 5
  lastError: String,
  createdAt: Date,
  nextRetryAt: Date            // Exponential backoff
}
```

### Attachment (extend existing)

```javascript
{
  // ... existing fields ...
  storageType: 'local' | 'google' | 'dropbox',
  cloudProvider: String,      // 'google' or 'dropbox'
  cloudFileId: String,         // Provider's file ID
  cloudPath: String,           // e.g., /OpenCRM/Accounts/ABC Corp/2024/03/
  cloudUrl: String,            // Direct link for viewing
  thumbnailUrl: String,        // Preview image
  uploadQueueId: ObjectId      // Reference to queue job
}
```

## API Endpoints

### Admin Settings

```
GET  /api/admin/cloud-storage
     → List configured providers, their status, storage usage

POST /api/admin/cloud-storage/google
     → Configure Google Drive credentials (clientId, clientSecret, refreshToken)

POST /api/admin/cloud-storage/dropbox
     → Configure Dropbox credentials (appKey, appSecret, accessToken)

DELETE /api/admin/cloud-storage/:provider
     → Remove a provider's credentials
```

### File Operations

```
POST /api/attachments/upload
     → Upload file to cloud storage
     Body: { file, entityType, entityId, provider }
     Returns: { attachment, uploadQueueJob, estimatedTime }

GET  /api/attachments/:id/download
     → Get download URL (generates signed URL or redirects)

GET  /api/attachments/:id/thumbnail
     → Get thumbnail preview (cached)

POST /api/attachments/:id/retry
     → Manually retry failed upload
```

### Queue Management

```
GET  /api/admin/upload-queue
     → View pending/failed uploads (admin only)

POST /api/admin/upload-queue/:id/retry
     → Force retry a failed job
```

## Upload Flow

1. **User initiates upload**
   - Frontend sends file with entity type, entity ID, and provider choice

2. **Server validates and queues**
   - Generate cloud path: `/OpenCRM/{entityType}/{entityName}/{year}/{month}/`
   - Create attachment record with status 'uploading'
   - Create UploadQueue job
   - Return immediately with job ID

3. **Background worker processes**
   - Get credentials from CloudStorageCredential
   - Call provider API to upload
   - Update attachment with cloudFileId, cloudUrl
   - Mark job complete or retry on failure

4. **Frontend receives notification**
   - Poll attachment status OR
   - WebSocket event when upload completes

## Provider Abstraction

### BaseProvider Interface

```javascript
class BaseProvider {
  constructor(credentials) { throw new Error('Not implemented'); }

  async upload(path, file, options) { throw new Error('Not implemented'); }
  async download(fileId) { throw new Error('Not implemented'); }
  async delete(fileId) { throw new Error('Not implemented'); }
  async getFileInfo(fileId) { throw new Error('Not implemented'); }
  async generateThumbnail(fileId) { throw new Error('Not implemented'); }
  async refreshToken() { throw new Error('Not implemented'); }
  async testConnection() { throw new Error('Not implemented'); }
  get name() { throw new Error('Not implemented'); }
}
```

### Provider Factory

```javascript
function getProvider(providerName, credentials) {
  switch (providerName) {
    case 'google': return new GoogleDriveProvider(credentials);
    case 'dropbox': return new DropboxProvider(credentials);
    default: throw new Error(`Unknown provider: ${providerName}`);
  }
}
```

## Error Handling

### Retry Strategy

| Attempt | Delay |
|---------|-------|
| 1 | 1 second |
| 2 | 5 seconds |
| 3 | 30 seconds |
| 4 | 5 minutes |
| 5 | 15 minutes |

### Error Categories

| Error Type | Action |
|------------|--------|
| Network timeout | Retry immediately |
| Rate limit (429) | Retry after Retry-After header |
| Auth expired | Refresh token, retry |
| Quota exceeded | Fail, notify admin |
| Invalid credentials | Fail, notify admin |
| File too large | Fail immediately |
| File not found | Fail immediately |

## Security

### Credential Storage
- AES-256-GCM encryption at rest
- Encryption key from environment variable
- Never logged or exposed in API responses

### File Access Control
1. Verify user organization matches attachment
2. Check entity-level permissions
3. Generate time-limited signed URL (5 min)
4. Log download in audit trail

### OAuth Flow (Google Drive)
1. Admin initiates → redirect to Google OAuth
2. User authorizes → authorization code returned
3. Server exchanges for tokens (access + refresh)
4. Store encrypted refresh token
5. Use refresh token for new access tokens

### File Validation
- Max file size: 50 MB (configurable)
- Allowed types: Whitelist configurable by admin
- File name sanitization: Remove path traversal chars

## Implementation Phases

### Phase 1: Foundation (~2-3 days)
- CloudStorageCredential model + admin CRUD
- UploadQueue model + background worker setup
- Extend Attachment model
- Admin settings UI

### Phase 2: Google Drive (~3-4 days)
- GoogleDriveProvider implementation
- OAuth flow for refresh tokens
- Upload worker for Google Drive
- File upload UI component

### Phase 3: Dropbox (~2-3 days)
- DropboxProvider implementation
- Credential configuration UI
- Upload worker support

### Phase 4: Polish (~1-2 days)
- Admin upload queue management
- Error notifications
- Thumbnail generation
- Download audit logging