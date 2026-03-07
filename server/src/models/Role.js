import mongoose from 'mongoose';

const MODULES = ['accounts', 'contacts', 'leads', 'opportunities', 'activities', 'tasks', 'reports', 'admin', 'settings'];
const ACTIONS = ['view', 'edit', 'delete', 'create', 'export', 'import'];

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    enum: MODULES,
    required: true,
  },
  actions: [{
    type: String,
    enum: ACTIONS,
  }],
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  permissions: [permissionSchema],
}, {
  timestamps: true,
});

// Compound index for unique role names per organization
roleSchema.index({ name: 1, organization: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);

export default Role;