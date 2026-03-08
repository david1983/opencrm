import mongoose from 'mongoose';

const cloudStorageCredentialSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['google', 'dropbox'],
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    credentials: {
      type: Object,
      required: true,
      // For Google: { clientId, clientSecret, refreshToken }
      // For Dropbox: { accessToken } or { appKey, appSecret, refreshToken }
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'error'],
      default: 'active',
    },
    lastUsed: {
      type: Date,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one credential per org per provider
cloudStorageCredentialSchema.index(
  { organization: 1, provider: 1 },
  { unique: true }
);

const CloudStorageCredential = mongoose.model(
  'CloudStorageCredential',
  cloudStorageCredentialSchema
);

export default CloudStorageCredential;