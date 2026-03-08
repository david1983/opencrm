import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    // File content stored in database (for small files)
    // or URL to cloud storage (for larger files)
    content: {
      type: Buffer,
    },
    url: {
      type: String,
    },
    storageType: {
      type: String,
      enum: ['local', 'google', 'dropbox'],
      default: 'local',
    },
    cloudProvider: {
      type: String,
      enum: ['google', 'dropbox'],
    },
    cloudFileId: {
      type: String,
    },
    cloudPath: {
      type: String,
    },
    cloudUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    uploadQueueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadQueue',
    },
    // Polymorphic reference to the parent entity
    parentType: {
      type: String,
      required: true,
      enum: ['Account', 'Contact', 'Lead', 'Opportunity', 'Activity', 'Task'],
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'parentType',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying by parent
attachmentSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });
attachmentSchema.index({ organization: 1, createdAt: -1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;