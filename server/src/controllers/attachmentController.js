import Attachment from '../models/Attachment.js';
import UploadQueue from '../models/UploadQueue.js';
import ProviderFactory from '../services/cloud-storage/ProviderFactory.js';
import { createAuditLog } from '../utils/audit.js';

// Max file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

// Get all attachments for a parent entity
export const getAttachments = async (req, res, next) => {
  try {
    const { parentType, parentId } = req.query;

    if (!parentType || !parentId) {
      return res.status(400).json({
        success: false,
        error: 'parentType and parentId are required',
      });
    }

    const attachments = await Attachment.find({
      parentType,
      parentId,
      organization: req.user.organization,
    })
      .populate('owner', 'name email')
      .select('-content') // Don't return file content in list
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
};

// Get single attachment (with download)
export const getAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
      });
    }

    // Return metadata only (for API)
    if (req.query.meta === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          _id: attachment._id,
          filename: attachment.filename,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          createdAt: attachment.createdAt,
          owner: attachment.owner,
        },
      });
    }

    // Download file
    if (attachment.content) {
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      return res.send(attachment.content);
    }

    // Or redirect to URL
    if (attachment.url) {
      return res.redirect(attachment.url);
    }

    res.status(404).json({
      success: false,
      error: 'File content not found',
    });
  } catch (error) {
    next(error);
  }
};

// Upload attachment
export const uploadAttachment = async (req, res, next) => {
  try {
    const { parentType, parentId, provider } = req.body;

    if (!parentType || !parentId) {
      return res.status(400).json({
        success: false,
        error: 'parentType and parentId are required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Validate file size
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 50MB limit',
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'File type not allowed',
      });
    }

    // Determine storage type
    const storageType = provider && ProviderFactory.isValidProvider(provider)
      ? provider
      : 'local';

    // Create attachment
    const attachment = await Attachment.create({
      filename: req.file.filename || req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      content: storageType === 'local' ? req.file.buffer : undefined,
      parentType,
      parentId,
      owner: req.user.id,
      organization: req.user.organization,
      storageType,
    });

    // If cloud storage, queue upload job
    if (storageType !== 'local') {
      const uploadJob = await UploadQueue.create({
        organization: req.user.organization,
        attachment: attachment._id,
        provider: storageType,
      });

      // Return without content
      const response = attachment.toObject();
      delete response.content;

      return res.status(201).json({
        success: true,
        data: {
          attachment: response,
          uploadJob: {
            _id: uploadJob._id,
            status: uploadJob.status,
          },
        },
      });
    }

    // Create audit log
    await createAuditLog({
      entityType: parentType,
      entityId: parentId,
      action: 'update',
      changes: [{ field: 'attachments', oldValue: null, newValue: `Added attachment: ${req.file.originalname}` }],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    // Return attachment without content
    const response = attachment.toObject();
    delete response.content;

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const getUploadStatus = async (req, res, next) => {
  try {
    const job = await UploadQueue.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Upload job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: job.status,
        attempts: job.attempts,
        lastError: job.lastError,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete attachment
export const deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
      });
    }

    if (attachment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this attachment',
      });
    }

    await attachment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};