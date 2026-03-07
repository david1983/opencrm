import { body, query } from 'express-validator';

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginRules = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const accountRules = [
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('website').optional().isURL().withMessage('Please enter a valid URL'),
];

export const contactRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
];

export const leadRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('company').optional().trim(),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Unqualified'])
    .withMessage('Invalid status'),
  body('source')
    .optional()
    .isIn(['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'])
    .withMessage('Invalid source'),
];

export const opportunityRules = [
  body('name').trim().notEmpty().withMessage('Opportunity name is required'),
  body('closeDate').isISO8601().withMessage('Close date is required'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('stage')
    .optional()
    .isIn(['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'])
    .withMessage('Invalid stage'),
];

export const activityRules = [
  body('type').isIn(['Call', 'Email', 'Meeting', 'Note']).withMessage('Invalid activity type'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('date').optional().isISO8601().withMessage('Invalid date'),
];

export const taskRules = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('dueDate').isISO8601().withMessage('Due date is required'),
  body('status')
    .optional()
    .isIn(['Not Started', 'In Progress', 'Completed', 'Deferred'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['Low', 'Normal', 'High'])
    .withMessage('Invalid priority'),
];

export const paginationRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];