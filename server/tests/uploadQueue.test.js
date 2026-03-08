import mongoose from 'mongoose';
import UploadQueue from '../src/models/UploadQueue.js';

describe('UploadQueue Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await UploadQueue.deleteMany({});
  });

  it('should create an upload job with defaults', async () => {
    const job = await UploadQueue.create({
      organization: new mongoose.Types.ObjectId(),
      attachment: new mongoose.Types.ObjectId(),
      provider: 'google',
    });

    expect(job.status).toBe('pending');
    expect(job.attempts).toBe(0);
    expect(job.maxAttempts).toBe(5);
  });

  it('should calculate nextRetryAt with exponential backoff', async () => {
    const job = await UploadQueue.create({
      organization: new mongoose.Types.ObjectId(),
      attachment: new mongoose.Types.ObjectId(),
      provider: 'dropbox',
      attempts: 2,
    });

    const retryDelay = job.getNextRetryDelay();
    expect(retryDelay).toBe(30000); // 30 seconds for attempt 3
  });

  it('should transition through statuses', async () => {
    const job = await UploadQueue.create({
      organization: new mongoose.Types.ObjectId(),
      attachment: new mongoose.Types.ObjectId(),
      provider: 'google',
    });

    expect(job.status).toBe('pending');

    job.status = 'uploading';
    await job.save();
    expect(job.status).toBe('uploading');

    job.status = 'completed';
    await job.save();
    expect(job.status).toBe('completed');
  });

  it('should schedule retry with exponential backoff', async () => {
    const job = await UploadQueue.create({
      organization: new mongoose.Types.ObjectId(),
      attachment: new mongoose.Types.ObjectId(),
      provider: 'google',
    });

    await job.scheduleRetry('Network error');

    expect(job.status).toBe('pending');
    expect(job.attempts).toBe(1);
    expect(job.lastError).toBe('Network error');
    expect(job.nextRetryAt).toBeInstanceOf(Date);
    expect(job.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should mark job as failed after max attempts', async () => {
    const job = await UploadQueue.create({
      organization: new mongoose.Types.ObjectId(),
      attachment: new mongoose.Types.ObjectId(),
      provider: 'google',
      attempts: 4,
    });

    await job.scheduleRetry('Final error');

    expect(job.status).toBe('failed');
    expect(job.attempts).toBe(5);
    expect(job.lastError).toBe('Final error');
  });

  it('should use correct exponential backoff delays', async () => {
    const job = await UploadQueue.create({
      organization: new mongoose.Types.ObjectId(),
      attachment: new mongoose.Types.ObjectId(),
      provider: 'dropbox',
    });

    // Test all delay levels
    const delays = [1000, 5000, 30000, 300000, 900000];
    for (let i = 0; i < 5; i++) {
      expect(job.getNextRetryDelay()).toBe(delays[i]);
      job.attempts = i + 1;
    }
  });
});