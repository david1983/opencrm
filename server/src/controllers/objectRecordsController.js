import { getOrCreateModel, getObjectDefinition } from '../services/dynamicModel.js';

// @desc    Get object definition with fields
// @route   GET /api/objects/:objectName/definition
export const getDefinition = async (req, res, next) => {
  try {
    const { objectName } = req.params;

    const objectDef = await getObjectDefinition(objectName);

    res.status(200).json({
      success: true,
      data: objectDef,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get records for a custom object
// @route   GET /api/objects/:objectName
export const getRecords = async (req, res, next) => {
  try {
    const { objectName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    // Get object definition
    const objectDef = await getObjectDefinition(objectName);
    const Model = await getOrCreateModel(objectDef.name);

    // Build query - filter by organization
    let query = { organization: req.user.organization };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Model.countDocuments(query);
    const records = await Model.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: records,
      object: objectDef,
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

// @desc    Get single record
// @route   GET /api/objects/:objectName/:id
export const getRecord = async (req, res, next) => {
  try {
    const { objectName, id } = req.params;

    const objectDef = await getObjectDefinition(objectName);
    const Model = await getOrCreateModel(objectDef.name);

    const record = await Model.findOne({
      _id: id,
      organization: req.user.organization,
    }).populate('owner', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
      object: objectDef,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create record
// @route   POST /api/objects/:objectName
export const createRecord = async (req, res, next) => {
  try {
    const { objectName } = req.params;

    const objectDef = await getObjectDefinition(objectName);
    const Model = await getOrCreateModel(objectDef.name);

    // Add owner and organization
    req.body.owner = req.user._id;
    req.body.organization = req.user.organization;

    const record = await Model.create(req.body);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update record
// @route   PUT /api/objects/:objectName/:id
export const updateRecord = async (req, res, next) => {
  try {
    const { objectName, id } = req.params;

    const objectDef = await getObjectDefinition(objectName);
    const Model = await getOrCreateModel(objectDef.name);

    const record = await Model.findOneAndUpdate(
      { _id: id, organization: req.user.organization },
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete record
// @route   DELETE /api/objects/:objectName/:id
export const deleteRecord = async (req, res, next) => {
  try {
    const { objectName, id } = req.params;

    const objectDef = await getObjectDefinition(objectName);
    const Model = await getOrCreateModel(objectDef.name);

    const record = await Model.findOneAndDelete({
      _id: id,
      organization: req.user.organization,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};