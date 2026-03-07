import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    logo: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    phone: {
      type: String,
    },
    website: {
      type: String,
    },
    industry: {
      type: String,
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
    },
    fiscalYearStart: {
      type: Number,
      default: 1, // January
    },
    features: {
      leads: { type: Boolean, default: true },
      opportunities: { type: Boolean, default: true },
      activities: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Single organization per instance (singleton pattern)
organizationSchema.statics.getOrganization = async function () {
  let org = await this.findOne();
  if (!org) {
    org = await this.create({ name: 'My Organization' });
  }
  return org;
};

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;