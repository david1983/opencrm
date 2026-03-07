import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Deferred'],
      default: 'Not Started',
    },
    priority: {
      type: String,
      enum: ['Low', 'Normal', 'High'],
      default: 'Normal',
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
taskSchema.index({ subject: 'text' });
taskSchema.index({ dueDate: 1, owner: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;