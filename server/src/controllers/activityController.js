import Activity from '../models/Activity.js';

export const getActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { owner: req.user.id };

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.contact) {
      query.contact = req.query.contact;
    }

    if (req.query.account) {
      query.account = req.query.account;
    }

    if (req.query.opportunity) {
      query.opportunity = req.query.opportunity;
    }

    const total = await Activity.countDocuments(query);
    const activities = await Activity.find(query)
      .populate('owner', 'name email')
      .populate('contact', 'firstName lastName')
      .populate('account', 'name')
      .populate('opportunity', 'name')
      .populate('lead', 'firstName lastName')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: activities,
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

export const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    })
      .populate('owner', 'name email')
      .populate('contact', 'firstName lastName email phone')
      .populate('account', 'name industry')
      .populate('opportunity', 'name stage amount');

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    const activity = await Activity.create(req.body);

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req, res, next) => {
  try {
    let activity = await Activity.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    if (activity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this activity',
      });
    }

    activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    if (activity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this activity',
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};