import Opportunity from '../models/Opportunity.js';
import { createAuditLog, detectChanges } from '../utils/audit.js';

export const getOpportunities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { owner: req.user.id };

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    if (req.query.stage) {
      query.stage = req.query.stage;
    }

    if (req.query.account) {
      query.account = req.query.account;
    }

    const total = await Opportunity.countDocuments(query);
    const opportunities = await Opportunity.find(query)
      .populate('owner', 'name email')
      .populate('account', 'name industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate('owner', 'name email')
      .populate('account', 'name industry phone website');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
      });
    }

    // Check if user can access this opportunity (owner or admin)
    if (opportunity.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

export const createOpportunity = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    req.body.organization = req.user.organization;
    const opportunity = await Opportunity.create(req.body);

    // Create audit log
    await createAuditLog({
      entityType: 'Opportunity',
      entityId: opportunity._id,
      action: 'create',
      changes: Object.keys(req.body).map(field => ({
        field,
        oldValue: null,
        newValue: req.body[field],
      })),
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    res.status(201).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOpportunity = async (req, res, next) => {
  try {
    let opportunity = await Opportunity.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
      });
    }

    if (opportunity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this opportunity',
      });
    }

    // Store old values for audit
    const oldOpportunity = opportunity.toObject();

    opportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Create audit log with detected changes
    const changes = detectChanges(oldOpportunity, opportunity.toObject());
    if (changes.length > 0) {
      await createAuditLog({
        entityType: 'Opportunity',
        entityId: opportunity._id,
        action: 'update',
        changes,
        userId: req.user.id,
        organizationId: req.user.organization,
      });
    }

    res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
      });
    }

    if (opportunity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this opportunity',
      });
    }

    // Create audit log before deletion
    await createAuditLog({
      entityType: 'Opportunity',
      entityId: opportunity._id,
      action: 'delete',
      changes: [],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    await opportunity.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};