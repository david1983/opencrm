import { getAuditHistory, getRecentAuditHistory } from '../utils/audit.js';

/**
 * Get audit history for a specific entity
 */
export const getEntityHistory = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const organizationId = req.user.organization;

    const validEntityTypes = ['Account', 'Contact', 'Lead', 'Opportunity', 'Activity', 'Task'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid entity type: ${entityType}`,
      });
    }

    const logs = await getAuditHistory({
      entityType,
      entityId,
      organizationId,
      limit: 100,
    });

    res.json({
      status: 'success',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent audit history for the organization
 */
export const getOrganizationHistory = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await getRecentAuditHistory({
      organizationId,
      limit,
    });

    res.json({
      status: 'success',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};