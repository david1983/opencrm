import AuditLog from '../models/AuditLog.js';

/**
 * Helper to get display name for a field
 */
const getFieldLabel = (field) => {
  const labels = {
    name: 'Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    title: 'Title',
    industry: 'Industry',
    website: 'Website',
    address: 'Address',
    description: 'Description',
    stage: 'Stage',
    amount: 'Amount',
    probability: 'Probability',
    closeDate: 'Close Date',
    status: 'Status',
    source: 'Source',
    company: 'Company',
    type: 'Type',
    subject: 'Subject',
    date: 'Date',
    duration: 'Duration',
    dueDate: 'Due Date',
    priority: 'Priority',
    account: 'Account',
    contact: 'Contact',
    owner: 'Owner',
  };
  return labels[field] || field;
};

/**
 * Helper to format values for display
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value._id) {
    return value.name || value._id.toString();
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
};

/**
 * Detect changes between old and new documents
 */
export const detectChanges = (oldDoc, newDoc) => {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(oldDoc || {}),
    ...Object.keys(newDoc || {}),
  ]);

  // Skip internal fields
  const skipFields = ['_id', '__v', 'createdAt', 'updatedAt'];

  for (const key of allKeys) {
    if (skipFields.includes(key)) continue;

    const oldVal = oldDoc?.[key];
    const newVal = newDoc?.[key];

    // Compare values
    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldStr !== newStr) {
      changes.push({
        field: key,
        oldValue: formatValue(oldVal),
        newValue: formatValue(newVal),
      });
    }
  }

  return changes;
};

/**
 * Create an audit log entry
 */
export const createAuditLog = async ({
  entityType,
  entityId,
  action,
  changes,
  userId,
  organizationId,
}) => {
  try {
    const auditLog = new AuditLog({
      entityType,
      entityId,
      action,
      changes,
      changedBy: userId,
      organization: organizationId,
    });
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging shouldn't break the main operation
    return null;
  }
};

/**
 * Get audit history for an entity
 */
export const getAuditHistory = async ({
  entityType,
  entityId,
  organizationId,
  limit = 50,
}) => {
  const logs = await AuditLog.find({
    entityType,
    entityId,
    organization: organizationId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('changedBy', 'name email');

  return logs;
};

/**
 * Get recent audit history for organization
 */
export const getRecentAuditHistory = async ({
  organizationId,
  limit = 100,
}) => {
  const logs = await AuditLog.find({
    organization: organizationId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('changedBy', 'name email');

  return logs;
};

export { getFieldLabel, formatValue };