import mongoose from 'mongoose';
import CustomObject from '../models/CustomObject.js';
import CustomField from '../models/CustomField.js';

// Cache for dynamic models
const modelCache = new Map();

/**
 * Convert CustomField type to Mongoose schema type definition
 * @param {Object} field - CustomField document
 * @returns {Object} Mongoose schema type definition
 */
const getFieldTypeDefinition = (field) => {
  const baseDefinition = {
    required: field.required || false,
  };

  switch (field.type) {
    case 'Text':
    case 'Email':
    case 'Phone':
    case 'Url':
    case 'TextArea':
    case 'LongTextArea':
      baseDefinition.type = String;
      baseDefinition.trim = true;
      if (field.validation?.minLength) {
        baseDefinition.minlength = field.validation.minLength;
      }
      if (field.validation?.maxLength) {
        baseDefinition.maxlength = field.validation.maxLength;
      }
      if (field.validation?.regex) {
        baseDefinition.match = new RegExp(field.validation.regex);
      }
      break;

    case 'Number':
    case 'Currency':
    case 'Percent':
      baseDefinition.type = Number;
      if (field.validation?.minValue !== undefined) {
        baseDefinition.min = field.validation.minValue;
      }
      if (field.validation?.maxValue !== undefined) {
        baseDefinition.max = field.validation.maxValue;
      }
      break;

    case 'Date':
    case 'DateTime':
      baseDefinition.type = Date;
      break;

    case 'Boolean':
      baseDefinition.type = Boolean;
      break;

    case 'Picklist':
      baseDefinition.type = String;
      if (field.options && field.options.length > 0) {
        baseDefinition.enum = field.options.map(opt => opt.value);
        // Set default value if specified
        const defaultOption = field.options.find(opt => opt.default);
        if (defaultOption) {
          baseDefinition.default = defaultOption.value;
        }
      }
      break;

    case 'MultiPicklist':
      baseDefinition.type = [String];
      if (field.options && field.options.length > 0) {
        baseDefinition.enum = field.options.map(opt => opt.value);
      }
      break;

    case 'Lookup':
      baseDefinition.type = mongoose.Schema.Types.ObjectId;
      baseDefinition.ref = field.lookupObject || 'User';
      break;

    default:
      baseDefinition.type = String;
  }

  // Set default value if provided
  if (field.defaultValue !== undefined && field.type !== 'Picklist') {
    baseDefinition.default = field.defaultValue;
  }

  return baseDefinition;
};

/**
 * Build a Mongoose schema from field definitions
 * @param {Array} fields - Array of CustomField documents
 * @returns {mongoose.Schema} Mongoose schema
 */
const buildSchemaFromFields = (fields) => {
  const schemaDefinition = {};

  // Add standard fields for all records
  schemaDefinition.owner = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  };

  schemaDefinition.organization = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  };

  // Add custom fields
  fields.forEach(field => {
    if (!field.active) return;

    schemaDefinition[field.name] = getFieldTypeDefinition(field);
  });

  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
  });

  // Add text index for searchable fields
  const textIndexFields = {};
  fields.forEach(field => {
    if (field.active && ['Text', 'Email', 'Phone', 'Url', 'TextArea', 'LongTextArea'].includes(field.type)) {
      textIndexFields[field.name] = 'text';
    }
  });

  // Only create text index if there are text-searchable fields
  if (Object.keys(textIndexFields).length > 0) {
    schema.index(textIndexFields);
  }

  return schema;
};

/**
 * Get object definition with fields
 * @param {string} objectName - Name of the custom object
 * @returns {Object|null} Object definition with fields
 */
const getObjectDefinition = async (objectName) => {
  const object = await CustomObject.findOne({
    name: objectName,
    active: true,
  });

  if (!object) {
    return null;
  }

  const fields = await CustomField.find({
    object: object._id,
    active: true,
  }).sort({ order: 1, createdAt: 1 });

  return {
    ...object.toObject(),
    fields,
  };
};

/**
 * Get or create a dynamic Mongoose model for a custom object
 * @param {string} objectName - Name of the custom object
 * @returns {mongoose.Model|null} Mongoose model or null if object not found
 */
const getOrCreateModel = async (objectName) => {
  // Check if model is already cached
  if (modelCache.has(objectName)) {
    return modelCache.get(objectName);
  }

  // Get object definition
  const objectDef = await getObjectDefinition(objectName);
  if (!objectDef) {
    return null;
  }

  // Check if the model is already registered with mongoose
  if (mongoose.models[objectName]) {
    const existingModel = mongoose.models[objectName];
    modelCache.set(objectName, existingModel);
    return existingModel;
  }

  // Build schema from fields
  const schema = buildSchemaFromFields(objectDef.fields);

  // Create and cache the model
  const model = mongoose.model(objectName, schema);
  modelCache.set(objectName, model);

  return model;
};

/**
 * Clear the model cache (useful for testing or when schema changes)
 */
const clearModelCache = () => {
  modelCache.clear();
};

export {
  getFieldTypeDefinition,
  buildSchemaFromFields,
  getOrCreateModel,
  getObjectDefinition,
  clearModelCache,
};