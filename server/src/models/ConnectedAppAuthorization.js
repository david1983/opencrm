import mongoose from 'mongoose';

const connectedAppAuthorizationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  connectedApp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectedApp',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },

  // OAuth tokens (hashed)
  accessTokenHash: {
    type: String,
    select: false,
  },
  refreshTokenHash: {
    type: String,
    select: false,
  },
  expiresAt: {
    type: Date,
  },

  // Granted scopes (subset of app's available scopes)
  grantedScopes: [{
    type: String,
  }],

  // For API key authorizations
  isApiKey: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for unique app authorization per user
connectedAppAuthorizationSchema.index(
  { user: 1, connectedApp: 1 },
  { unique: true }
);

const ConnectedAppAuthorization = mongoose.model(
  'ConnectedAppAuthorization',
  connectedAppAuthorizationSchema
);

export default ConnectedAppAuthorization;