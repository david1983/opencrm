import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // The type of entity being audited
    entityType: {
      type: String,
      required: true,
      enum: ['Account', 'Contact', 'Lead', 'Opportunity', 'Activity', 'Task'],
    },
    // The ID of the entity
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // The action performed
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'convert'],
    },
    // Array of field changes
    changes: [
      {
        field: {
          type: String,
          required: true,
        },
        oldValue: {
          type: mongoose.Schema.Types.Mixed,
        },
        newValue: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    // User who made the change
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Organization for multi-tenancy
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    // Timestamp is handled by timestamps option
  },
  {
    timestamps: true,
  }
);

// Index for querying by entity
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ organization: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;