import Lead from '../models/Lead.js';
import { createAuditLog, detectChanges } from '../utils/audit.js';

export const getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { owner: req.user.id };

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.source) {
      query.source = req.query.source;
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: leads,
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

export const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate('owner', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    // Check if user can access this lead (owner or admin)
    if (lead.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    req.body.organization = req.user.organization;
    const lead = await Lead.create(req.body);

    // Create audit log
    await createAuditLog({
      entityType: 'Lead',
      entityId: lead._id,
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
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    if (lead.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead',
      });
    }

    // Store old values for audit
    const oldLead = lead.toObject();

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Create audit log with detected changes
    const changes = detectChanges(oldLead, lead.toObject());
    if (changes.length > 0) {
      await createAuditLog({
        entityType: 'Lead',
        entityId: lead._id,
        action: 'update',
        changes,
        userId: req.user.id,
        organizationId: req.user.organization,
      });
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    if (lead.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lead',
      });
    }

    // Create audit log before deletion
    await createAuditLog({
      entityType: 'Lead',
      entityId: lead._id,
      action: 'delete',
      changes: [],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const convertLead = async (req, res, next) => {
  try {
    // First, check authorization
    const existingLead = await Lead.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate('owner', 'name email');

    if (!existingLead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    if (existingLead.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to convert this lead',
      });
    }

    if (existingLead.status === 'Converted') {
      return res.status(400).json({
        success: false,
        error: 'Lead has already been converted',
      });
    }

    // Atomic check-and-update to prevent race conditions
    // Only allow conversion if status is not already 'Converted' or 'Converting'
    const originalStatus = existingLead.status;
    const lead = await Lead.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization,
        status: { $nin: ['Converted', 'Converting'] },
      },
      { status: 'Converting' },
      { new: true }
    ).populate('owner', 'name email');

    if (!lead) {
      return res.status(400).json({
        success: false,
        error: 'Lead is already being converted by another request',
      });
    }

    // Import models dynamically to avoid circular dependencies
    const Account = (await import('../models/Account.js')).default;
    const Contact = (await import('../models/Contact.js')).default;
    const Opportunity = (await import('../models/Opportunity.js')).default;

    const { createAccount, createOpportunity, accountName, opportunityName } = req.body;

    let account = null;
    let contact = null;
    let opportunity = null;

    try {
      // Create or use existing account
      if (createAccount && accountName) {
        account = await Account.create({
          name: accountName,
          industry: lead.industry || 'Other',
          website: lead.website || '',
          phone: lead.phone || '',
          owner: req.user.id,
          organization: req.user.organization,
        });

        // Create audit log for new account
        await createAuditLog({
          entityType: 'Account',
          entityId: account._id,
          action: 'create',
          changes: [{ field: 'name', oldValue: null, newValue: accountName }],
          userId: req.user.id,
          organizationId: req.user.organization,
        });
      }

      // Create contact
      contact = await Contact.create({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        account: account?._id || null,
        owner: req.user.id,
        organization: req.user.organization,
        leadSource: lead.source,
      });

      // Create audit log for new contact
      await createAuditLog({
        entityType: 'Contact',
        entityId: contact._id,
        action: 'create',
        changes: [
          { field: 'firstName', oldValue: null, newValue: lead.firstName },
          { field: 'lastName', oldValue: null, newValue: lead.lastName },
        ],
        userId: req.user.id,
        organizationId: req.user.organization,
      });

      // Create opportunity if requested
      if (createOpportunity && opportunityName && account) {
        opportunity = await Opportunity.create({
          name: opportunityName,
          account: account._id,
          stage: 'Prospecting',
          probability: 10,
          amount: 0,
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          owner: req.user.id,
          organization: req.user.organization,
        });

        // Create audit log for new opportunity
        await createAuditLog({
          entityType: 'Opportunity',
          entityId: opportunity._id,
          action: 'create',
          changes: [{ field: 'name', oldValue: null, newValue: opportunityName }],
          userId: req.user.id,
          organizationId: req.user.organization,
        });
      }

      // Update lead status to Converted
      const oldLead = lead.toObject();
      lead.status = 'Converted';
      lead.convertedAt = new Date();
      lead.convertedTo = {
        account: account?._id,
        contact: contact._id,
        opportunity: opportunity?._id,
      };
      await lead.save();

      // Create audit log for lead conversion
      await createAuditLog({
        entityType: 'Lead',
        entityId: lead._id,
        action: 'convert',
        changes: [
          { field: 'status', oldValue: oldLead.status, newValue: 'Converted' },
        ],
        userId: req.user.id,
        organizationId: req.user.organization,
      });

      res.status(200).json({
        success: true,
        data: {
          lead,
          account,
          contact,
          opportunity,
        },
      });
    } catch (conversionError) {
      // Revert lead status if conversion fails
      await Lead.findByIdAndUpdate(lead._id, { status: originalStatus });
      throw conversionError;
    }
  } catch (error) {
    next(error);
  }
};