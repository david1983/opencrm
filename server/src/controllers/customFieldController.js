import CustomField, { FIELD_TYPES } from '../models/CustomField.js';
import CustomObject from '../models/CustomObject.js';

export const getFieldTypes = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: FIELD_TYPES,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomFields = async (req, res, next) => {
  try {
    const { objectId } = req.params;

    const fields = await CustomField.find({ object: objectId }).sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: fields,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomField = async (req, res, next) => {
  try {
    const field = await CustomField.findById(req.params.id).populate('object', 'name label');

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found',
      });
    }

    res.status(200).json({
      success: true,
      data: field,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomField = async (req, res, next) => {
  try {
    const { object: objectId, name, label, type, required, unique, defaultValue, options, lookupObject, validation, description } = req.body;

    // Check if object exists
    const object = await CustomObject.findById(objectId);
    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Object not found',
      });
    }

    // Check if field with same name exists for this object
    const existing = await CustomField.findOne({ object: objectId, name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Field with this name already exists for this object',
      });
    }

    // Get max order for this object
    const maxOrder = await CustomField.findOne({ object: objectId }).sort('-order');
    const order = (maxOrder?.order || 0) + 1;

    const field = await CustomField.create({
      object: objectId,
      name,
      label,
      type,
      required: required || false,
      unique: unique || false,
      defaultValue,
      options: type === 'Picklist' || type === 'MultiPicklist' ? options : undefined,
      lookupObject: type === 'Lookup' ? lookupObject : undefined,
      validation,
      description,
      order,
    });

    res.status(201).json({
      success: true,
      data: field,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomField = async (req, res, next) => {
  try {
    const { label, required, unique, defaultValue, options, lookupObject, validation, description, active } = req.body;

    let field = await CustomField.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found',
      });
    }

    field = await CustomField.findByIdAndUpdate(
      req.params.id,
      {
        label,
        required,
        unique,
        defaultValue,
        options: field.type === 'Picklist' || field.type === 'MultiPicklist' ? options : undefined,
        lookupObject: field.type === 'Lookup' ? lookupObject : undefined,
        validation,
        description,
        active,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: field,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomField = async (req, res, next) => {
  try {
    const field = await CustomField.findById(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found',
      });
    }

    // Check if it's a system field (name field)
    if (field.name === 'name') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the name field',
      });
    }

    await field.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const reorderFields = async (req, res, next) => {
  try {
    const { objectId } = req.params;
    const { fieldOrder } = req.body; // Array of field IDs in new order

    // Update order for each field
    await Promise.all(
      fieldOrder.map((fieldId, index) =>
        CustomField.findByIdAndUpdate(fieldId, { order: index })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Fields reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};