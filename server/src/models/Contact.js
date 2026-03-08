import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
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
    title: {
      type: String,
      trim: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
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
    leadSource: {
      type: String,
      enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
contactSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Virtual for full name
contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;