import UploadQueue from '../models/UploadQueue.js';
import CloudStorageCredential from '../models/CloudStorageCredential.js';
import Attachment from '../models/Attachment.js';
import ProviderFactory from '../services/cloud-storage/ProviderFactory.js';

class UploadWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 5000; // 5 seconds
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Upload worker started');
    this.processQueue();
  }

  stop() {
    this.isRunning = false;
    console.log('Upload worker stopped');
  }

  async processQueue() {
    while (this.isRunning) {
      try {
        const job = await this.getNextJob();
        if (job) {
          await this.processJob(job);
        } else {
          // No jobs, wait before polling again
          await this.sleep(this.pollInterval);
        }
      } catch (error) {
        console.error('Upload worker error:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  async getNextJob() {
    return UploadQueue.findOneAndUpdate(
      {
        status: 'pending',
        $or: [
          { nextRetryAt: { $lte: new Date() } },
          { nextRetryAt: null },
        ],
      },
      { status: 'uploading' },
      { new: true }
    );
  }

  async processJob(job) {
    try {
      // Get credential
      const credential = await CloudStorageCredential.findOne({
        organization: job.organization,
        provider: job.provider,
      });

      if (!credential) {
        throw new Error('No credentials configured for this provider');
      }

      // Get attachment
      const attachment = await Attachment.findById(job.attachment);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Create provider instance
      const provider = ProviderFactory.getProvider(
        job.provider,
        credential.credentials
      );

      // Test connection on first attempt
      if (job.attempts === 0) {
        await provider.testConnection();
      }

      // Generate cloud path
      const cloudPath = provider.generatePath(
        attachment.parentType,
        attachment.parentId.toString()
      );

      // Upload file
      const result = await provider.upload(cloudPath, {
        originalname: attachment.originalName,
        mimetype: attachment.mimeType,
        buffer: attachment.content,
      });

      // Update attachment
      await Attachment.findByIdAndUpdate(job.attachment, {
        storageType: job.provider,
        cloudProvider: job.provider,
        cloudFileId: result.fileId,
        cloudPath,
        cloudUrl: result.webViewLink,
        thumbnailUrl: result.thumbnailLink,
        content: undefined, // Remove local content
        url: result.webViewLink,
      });

      // Update credential last used
      credential.lastUsed = new Date();
      await credential.save();

      // Mark job complete
      await UploadQueue.findByIdAndUpdate(job._id, {
        status: 'completed',
      });

      console.log(`Upload completed: ${attachment.originalName}`);
    } catch (error) {
      console.error(`Upload failed (attempt ${job.attempts + 1}):`, error.message);
      await job.scheduleRetry(error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const uploadWorker = new UploadWorker();

export default uploadWorker;