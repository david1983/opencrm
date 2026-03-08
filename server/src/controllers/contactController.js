import Contact from '../models/Contact.js';
import { createAuditLog, detectChanges } from '../utils/audit.js';

export const getContacts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { owner: req.user.id };

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    if (req.query.account) {
      query.account = req.query.account;
    }

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .populate('owner', 'name email')
      .populate('account', 'name industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: contacts,
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

export const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate('owner', 'name email')
      .populate('account', 'name industry phone website');

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    // Check if user can access this contact (owner or admin)
    if (contact.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    req.body.organization = req.user.organization;
    const contact = await Contact.create(req.body);

    // Create audit log
    await createAuditLog({
      entityType: 'Contact',
      entityId: contact._id,
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
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    let contact = await Contact.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this contact',
      });
    }

    // Store old values for audit
    const oldContact = contact.toObject();

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Create audit log with detected changes
    const changes = detectChanges(oldContact, contact.toObject());
    if (changes.length > 0) {
      await createAuditLog({
        entityType: 'Contact',
        entityId: contact._id,
        action: 'update',
        changes,
        userId: req.user.id,
        organizationId: req.user.organization,
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this contact',
      });
    }

    // Create audit log before deletion
    await createAuditLog({
      entityType: 'Contact',
      entityId: contact._id,
      action: 'delete',
      changes: [],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};