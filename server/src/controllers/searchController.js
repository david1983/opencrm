import Account from '../models/Account.js';
import Contact from '../models/Contact.js';
import Lead from '../models/Lead.js';
import Opportunity from '../models/Opportunity.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';

// @desc    Global search across all entities
// @route   GET /api/search
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          accounts: [],
          contacts: [],
          leads: [],
          opportunities: [],
          tasks: [],
          activities: [],
        },
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const limit = 5; // Limit results per entity

    // Search accounts
    const accounts = await Account.find({
      owner: req.user.id,
      $or: [
        { name: searchRegex },
        { industry: searchRegex },
        { website: searchRegex },
      ],
    })
      .limit(limit)
      .select('name industry website');

    // Search contacts
    const contacts = await Contact.find({
      owner: req.user.id,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    })
      .populate('account', 'name')
      .limit(limit)
      .select('firstName lastName email title account');

    // Search leads
    const leads = await Lead.find({
      owner: req.user.id,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
      ],
    })
      .limit(limit)
      .select('firstName lastName email company status');

    // Search opportunities
    const opportunities = await Opportunity.find({
      owner: req.user.id,
      $or: [
        { name: searchRegex },
      ],
    })
      .populate('account', 'name')
      .limit(limit)
      .select('name stage amount account');

    // Search tasks
    const tasks = await Task.find({
      owner: req.user.id,
      subject: searchRegex,
    })
      .populate('account', 'name')
      .populate('contact', 'firstName lastName')
      .limit(limit)
      .select('subject status dueDate priority');

    // Search activities
    const activities = await Activity.find({
      owner: req.user.id,
      $or: [
        { subject: searchRegex },
        { description: searchRegex },
      ],
    })
      .populate('account', 'name')
      .populate('contact', 'firstName lastName')
      .limit(limit)
      .select('subject type date');

    res.status(200).json({
      success: true,
      data: {
        accounts,
        contacts,
        leads,
        opportunities,
        tasks,
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};