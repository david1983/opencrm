import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [60000, 300000, 900000, 3600000, 14400000]; // 1m, 5m, 15m, 1h, 4h

const uploadQueueSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    attachment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'dropbox'],
    },
    status: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: MAX_RETRIES,
    },
    lastError: {
      type: String,
    },
    nextRetryAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate next retry time
uploadQueueSchema.methods.scheduleRetry = async function (errorMessage) {
  this.attempts += 1;
  this.lastError = errorMessage;

  if (this.attempts >= this.maxAttempts) {
    this.status = 'failed';
    this.nextRetryAt = null;
  } else {
    this.status = 'pending';
    const delayMs = RETRY_DELAYS[this.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    this.nextRetryAt = new Date(Date.now() + delayMs);
  }

  await this.save();
  return this;
};

const UploadQueue = mongoose.model('UploadQueue', uploadQueueSchema);

export default UploadQueue;