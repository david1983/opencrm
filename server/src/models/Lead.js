import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Converting'],
      default: 'New',
    },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'],
      default: 'Other',
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
    description: {
      type: String,
    },
    convertedAt: {
      type: Date,
    },
    convertedTo: {
      account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
      },
      contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
      },
      opportunity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
leadSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text' });

// Virtual for full name
leadSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;