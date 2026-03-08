import mongoose from 'mongoose';
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
      owner: req.user.id,
    }).populate('owner', 'name email');

    if (!lead) {
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
    let lead = await Lead.findById(req.params.id);

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
    const lead = await Lead.findById(req.params.id);

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
  // Attempt to start a MongoDB transaction. Transactions require a replica set;
  // on a standalone instance (e.g., mongodb-memory-server in tests) the driver
  // allows startSession/startTransaction but then throws
  // "Transaction numbers are only allowed on a replica set member or mongos"
  // on the first query that uses the session. We probe for replica-set support
  // with a lightweight hello command and fall back gracefully when unavailable.
  //
  // NOTE: Testing transaction rollback behaviour requires a replica set and cannot
  // be exercised with the current mongodb-memory-server standalone test setup.
  let session = null;
  try {
    const adminDb = mongoose.connection.db.admin();
    const hello = await adminDb.command({ hello: 1 });
    const hasReplicaSet = !!(hello.setName || hello.hosts);
    if (hasReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }
  } catch {
    // Could not determine replica set status — proceed without a transaction.
    session = null;
  }

  // Helper: merge session into options when a session is available.
  const withSession = (opts = {}) => (session ? { ...opts, session } : opts);

  try {
    const lead = await Lead.findById(req.params.id).session(session);

    if (!lead) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (lead.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      if (session) await session.abortTransaction();
      return res.status(403).json({ success: false, error: 'Not authorized to convert this lead' });
    }

    if (lead.status === 'Converted') {
      if (session) await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Lead has already been converted' });
    }

    // Import models dynamically to avoid circular dependencies
    const Account = (await import('../models/Account.js')).default;
    const Contact = (await import('../models/Contact.js')).default;
    const Opportunity = (await import('../models/Opportunity.js')).default;

    const { createAccount, createOpportunity, accountName, opportunityName } = req.body;

    let account = null;
    let contact = null;
    let opportunity = null;

    // Create or use existing account
    if (createAccount && accountName) {
      [account] = await Account.create([{
        name: accountName,
        industry: lead.industry || 'Other',
        website: lead.website || '',
        phone: lead.phone || '',
        owner: req.user.id,
      }], withSession());

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
    [contact] = await Contact.create([{
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      title: lead.title,
      account: account?._id || null,
      owner: req.user.id,
      leadSource: lead.source,
    }], withSession());

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
      [opportunity] = await Opportunity.create([{
        name: opportunityName,
        account: account._id,
        stage: 'Prospecting',
        probability: 10,
        amount: 0,
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        owner: req.user.id,
      }], withSession());

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
    await lead.save(withSession());

    await createAuditLog({
      entityType: 'Lead',
      entityId: lead._id,
      action: 'convert',
      changes: [{ field: 'status', oldValue: oldLead.status, newValue: 'Converted' }],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    if (session) await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: { lead, account, contact, opportunity },
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};