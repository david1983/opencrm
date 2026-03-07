import Opportunity from '../models/Opportunity.js';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js';
import Account from '../models/Account.js';
import Contact from '../models/Contact.js';

// @desc    Get pipeline report
// @route   GET /api/reports/pipeline
export const getPipelineReport = async (req, res, next) => {
  try {
    const pipeline = await Opportunity.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const stageOrder = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    pipeline.sort((a, b) => stageOrder.indexOf(a._id) - stageOrder.indexOf(b._id));

    const totalValue = pipeline.reduce((sum, stage) => sum + stage.totalAmount, 0);
    const totalCount = pipeline.reduce((sum, stage) => sum + stage.count, 0);

    res.status(200).json({
      success: true,
      data: {
        stages: pipeline,
        summary: {
          totalValue,
          totalCount,
          avgDealSize: totalCount > 0 ? totalValue / totalCount : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leads by source report
// @route   GET /api/reports/leads-by-source
export const getLeadsBySource = async (req, res, next) => {
  try {
    const leadsBySource = await Lead.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = leadsBySource.reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      success: true,
      data: {
        sources: leadsBySource,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leads by status
// @route   GET /api/reports/leads-by-status
export const getLeadsByStatus = async (req, res, next) => {
  try {
    const leadsByStatus = await Lead.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: leadsByStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity summary
// @route   GET /api/reports/activities
export const getActivitySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = { owner: req.user._id };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const byType = await Activity.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const recentActivities = await Activity.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('contact', 'firstName lastName')
      .populate('account', 'name');

    res.status(200).json({
      success: true,
      data: {
        byType,
        recent: recentActivities,
        total: byType.reduce((sum, item) => sum + item.count, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const [accountsCount, contactsCount, leadsCount, opportunitiesCount, tasksCount, overdueTasks, upcomingTasks, openOpportunities] = await Promise.all([
      Account.countDocuments({ owner: req.user._id }),
      Contact.countDocuments({ owner: req.user._id }),
      Lead.countDocuments({ owner: req.user._id }),
      Opportunity.countDocuments({ owner: req.user._id }),
      Task.countDocuments({ owner: req.user._id }),
      Task.countDocuments({ owner: req.user._id, dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } }),
      Task.find({ owner: req.user._id, dueDate: { $gte: new Date() }, status: { $ne: 'Completed' } })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('contact', 'firstName lastName')
        .populate('account', 'name'),
      Opportunity.find({ owner: req.user._id, stage: { $nin: ['Closed Won', 'Closed Lost'] } })
        .sort({ closeDate: 1 })
        .limit(5)
        .populate('account', 'name'),
    ]);

    // Pipeline value
    const pipelineValue = await Opportunity.aggregate([
      { $match: { owner: req.user._id, stage: { $nin: ['Closed Won', 'Closed Lost'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          accounts: accountsCount,
          contacts: contactsCount,
          leads: leadsCount,
          opportunities: opportunitiesCount,
          tasks: tasksCount,
        },
        pipelineValue: pipelineValue[0]?.total || 0,
        overdueTasks,
        upcomingTasks,
        openOpportunities,
      },
    });
  } catch (error) {
    next(error);
  }
};