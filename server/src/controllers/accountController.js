import Account from '../models/Account.js';
import { createAuditLog, detectChanges } from '../utils/audit.js';

// @desc    Get all accounts
// @route   GET /api/accounts
export const getAccounts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { owner: req.user.id };

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by industry
    if (req.query.industry) {
      query.industry = req.query.industry;
    }

    const total = await Account.countDocuments(query);
    const accounts = await Account.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: accounts,
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

// @desc    Get single account
// @route   GET /api/accounts/:id
export const getAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('owner', 'name email');

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create account
// @route   POST /api/accounts
export const createAccount = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    const account = await Account.create(req.body);

    // Create audit log
    await createAuditLog({
      entityType: 'Account',
      entityId: account._id,
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
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
export const updateAccount = async (req, res, next) => {
  try {
    let account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    // Make sure user owns the account
    if (account.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this account',
      });
    }

    // Store old values for audit
    const oldAccount = account.toObject();

    account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Create audit log with detected changes
    const changes = detectChanges(oldAccount, account.toObject());
    if (changes.length > 0) {
      await createAuditLog({
        entityType: 'Account',
        entityId: account._id,
        action: 'update',
        changes,
        userId: req.user.id,
        organizationId: req.user.organization,
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
export const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    // Make sure user owns the account
    if (account.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this account',
      });
    }

    // Create audit log before deletion
    await createAuditLog({
      entityType: 'Account',
      entityId: account._id,
      action: 'delete',
      changes: [],
      userId: req.user.id,
      organizationId: req.user.organization,
    });

    await account.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};