import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      maxlength: [10000, 'Content cannot be more than 10000 characters'],
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
noteSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });
noteSchema.index({ organization: 1, createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;