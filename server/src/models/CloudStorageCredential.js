import mongoose from 'mongoose';

const cloudStorageCredentialSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: false,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'dropbox'],
    },
    credentials: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      // For Google Drive: { clientId, clientSecret, refreshToken }
      // For Dropbox: { accessToken }
    },
    status: {
      type: String,
      enum: ['active', 'error', 'pending'],
      default: 'pending',
    },
    lastError: {
      type: String,
    },
    lastUsed: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for organization + provider (one config per provider per org)
cloudStorageCredentialSchema.index(
  { organization: 1, provider: 1 },
  { unique: true }
);

const CloudStorageCredential = mongoose.model(
  'CloudStorageCredential',
  cloudStorageCredentialSchema
);

export default CloudStorageCredential;