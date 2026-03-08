import CustomObject from '../models/CustomObject.js';
import CustomField from '../models/CustomField.js';

export const getCustomObjects = async (req, res, next) => {
  try {
    const objects = await CustomObject.find({
      organization: req.user.organization,
    }).sort({ name: 1 });

    // Get field counts for each object
    const objectsWithFields = await Promise.all(
      objects.map(async (obj) => {
        const fieldCount = await CustomField.countDocuments({ object: obj._id });
        return {
          ...obj.toObject(),
          fieldCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: objectsWithFields,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomObject = async (req, res, next) => {
  try {
    const object = await CustomObject.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Object not found',
      });
    }

    const fields = await CustomField.find({ object: object._id }).sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...object.toObject(),
        fields,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomObject = async (req, res, next) => {
  try {
    const { name, label, pluralLabel, description, icon, color, enableActivities, enableTasks, enableReports } = req.body;

    // Check if object with same name exists
    const existing = await CustomObject.findOne({
      name,
      organization: req.user.organization,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Object with this name already exists',
      });
    }

    const object = await CustomObject.create({
      name,
      label,
      pluralLabel: pluralLabel || `${label}s`,
      description,
      icon,
      color,
      enableActivities,
      enableTasks,
      enableReports,
      organization: req.user.organization,
    });

    // Create default name field
    await CustomField.create({
      object: object._id,
      name: 'name',
      label: 'Name',
      type: 'Text',
      required: true,
      order: 0,
    });

    res.status(201).json({
      success: true,
      data: object,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomObject = async (req, res, next) => {
  try {
    const { label, pluralLabel, description, icon, color, enableActivities, enableTasks, enableReports, active } = req.body;

    let object = await CustomObject.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Object not found',
      });
    }

    if (object.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system objects',
      });
    }

    object = await CustomObject.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      { label, pluralLabel, description, icon, color, enableActivities, enableTasks, enableReports, active },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: object,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomObject = async (req, res, next) => {
  try {
    const object = await CustomObject.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Object not found',
      });
    }

    if (object.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system objects',
      });
    }

    // Delete all fields for this object
    await CustomField.deleteMany({ object: object._id });

    await object.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};