import mongoose from 'mongoose';

const RETRY_DELAYS = {
  1: 1000,      // 1 second
  2: 5000,      // 5 seconds
  3: 30000,     // 30 seconds
  4: 300000,    // 5 minutes
  5: 900000,    // 15 minutes
};

const uploadQueueSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    attachment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
      required: true,
    },
    provider: {
      type: String,
      enum: ['google', 'dropbox'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'failed'],
      default: 'pending',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    lastError: {
      type: String,
    },
    nextRetryAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for processing pending jobs
uploadQueueSchema.index({ status: 1, nextRetryAt: 1 });

// Method to calculate next retry delay
uploadQueueSchema.methods.getNextRetryDelay = function () {
  return RETRY_DELAYS[this.attempts + 1] || RETRY_DELAYS[5];
};

// Method to schedule retry
uploadQueueSchema.methods.scheduleRetry = function (error) {
  this.attempts += 1;
  this.lastError = error;

  if (this.attempts >= this.maxAttempts) {
    this.status = 'failed';
  } else {
    this.status = 'pending';
    this.nextRetryAt = new Date(Date.now() + this.getNextRetryDelay());
  }

  return this.save();
};

const UploadQueue = mongoose.model('UploadQueue', uploadQueueSchema);

export default UploadQueue;