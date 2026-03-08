import mongoose from 'mongoose';

const customObjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Object name is required'],
      trim: true,
      // unique removed — uniqueness is now per-organization via compound index below
    },
    label: {
      type: String,
      required: [true, 'Object label is required'],
      trim: true,
    },
    pluralLabel: {
      type: String,
      required: [true, 'Plural label is required'],
    },
    description: { type: String },
    icon: { type: String, default: 'cube' },
    color: { type: String, default: '#3b82f6' },
    enableActivities: { type: Boolean, default: true },
    enableTasks: { type: Boolean, default: true },
    enableReports: { type: Boolean, default: true },
    enableSharing: { type: Boolean, default: false },
    recordNameField: { type: String, default: 'name' },
    recordNameLabel: { type: String, default: 'Name' },
    isSystem: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

// Unique name per organization
customObjectSchema.index({ name: 1, organization: 1 }, { unique: true });

customObjectSchema.statics.SYSTEM_OBJECTS = [
  { name: 'Account', label: 'Account', pluralLabel: 'Accounts', icon: 'office-building', color: '#3b82f6', isSystem: true },
  { name: 'Contact', label: 'Contact', pluralLabel: 'Contacts', icon: 'user', color: '#10b981', isSystem: true },
  { name: 'Lead', label: 'Lead', pluralLabel: 'Leads', icon: 'user-add', color: '#f59e0b', isSystem: true },
  { name: 'Opportunity', label: 'Opportunity', pluralLabel: 'Opportunities', icon: 'chart-bar', color: '#8b5cf6', isSystem: true },
  { name: 'Activity', label: 'Activity', pluralLabel: 'Activities', icon: 'calendar', color: '#ef4444', isSystem: true },
  { name: 'Task', label: 'Task', pluralLabel: 'Tasks', icon: 'check-circle', color: '#06b6d4', isSystem: true },
];

const CustomObject = mongoose.model('CustomObject', customObjectSchema);
export default CustomObject;
