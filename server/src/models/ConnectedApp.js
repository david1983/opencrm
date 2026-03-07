import mongoose from 'mongoose';

const connectedAppSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'App name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },

  // Authentication type
  authType: {
    type: String,
    enum: ['oauth', 'apikey'],
    required: true,
  },

  // OAuth configuration
  clientId: {
    type: String,
    unique: true,
    sparse: true,
  },
  clientSecretHash: {
    type: String,
    select: false,
  },
  redirectUris: [{
    type: String,
  }],

  // API Key configuration
  apiKeyHash: {
    type: String,
    select: false,
  },
  apiKeyPrefix: {
    type: String,
  },

  // Common settings
  scopes: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  rateLimit: {
    type: Number,
    default: 1000, // requests per hour
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const ConnectedApp = mongoose.model('ConnectedApp', connectedAppSchema);

export default ConnectedApp;