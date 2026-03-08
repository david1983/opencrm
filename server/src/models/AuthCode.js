import mongoose from 'mongoose';

const authCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clientId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConnectedApp', required: true },
  scopes: [{ type: String }],
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL: MongoDB auto-deletes at expiresAt
  },
});

const AuthCode = mongoose.model('AuthCode', authCodeSchema);
export default AuthCode;
