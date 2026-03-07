import mongoose from 'mongoose';
import CustomObject from '../models/CustomObject.js';
import CustomField from '../models/CustomField.js';

// Cache for dynamic models
const modelCache = new Map();

/**
 * Get field type definition for Mongoose schema
 */
function getFieldTypeDefinition(field) {
  const baseDef = {};

  switch (field.type) {
    case 'Text':
    case 'Email':
    case 'Phone':
    case 'Url':
    case 'TextArea':
    case 'LongTextArea':
      baseDef.type = String;
      if (field.type === 'Email') {
        baseDef.lowercase = true;
        baseDef.trim = true;
      }
      break;
    case 'Number':
    case 'Currency':
    case 'Percent':
      baseDef.type = Number;
      if (field.type === 'Percent') {
        baseDef.min = 0;
        baseDef.max = 100;
      }
      break;
    case 'Date':
    case 'DateTime':
      baseDef.type = Date;
      break;
    case 'Boolean':
      baseDef.type = Boolean;
      break;
    case 'Picklist':
      baseDef.type = String;
      if (field.options && field.options.length > 0) {
        baseDef.enum = field.options.map(opt => opt.value);
      }
      break;
    case 'MultiPicklist':
      baseDef.type = [String];
      if (field.options && field.options.length > 0) {
        baseDef.enum = field.options.map(opt => opt.value);
      }
      break;
    case 'Lookup':
      baseDef.type = mongoose.Schema.Types.ObjectId;
      if (field.lookupObject) {
        baseDef.ref = field.lookupObject;
      }
      break;
    default:
      baseDef.type = String;
  }

  // Add common field properties
  if (field.required) {
    baseDef.required = [true, `${field.label} is required`];
  }
  if (field.defaultValue !== undefined && field.defaultValue !== '') {
    baseDef.default = field.defaultValue;
  }

  return baseDef;
}

/**
 * Build Mongoose schema from custom field definitions
 */
function buildSchemaFromFields(fields) {
  const schemaDef = {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  };

  // Add each custom field to schema
  for (const field of fields) {
    if (field.name && field.name !== 'owner' && field.name !== 'organization') {
      schemaDef[field.name] = getFieldTypeDefinition(field);
    }
  }

  return new mongoose.Schema(schemaDef, { timestamps: true });
}

/**
 * Get or create a dynamic model for a custom object
 * @param {string} objectName - The name of the custom object (e.g., 'Project')
 * @returns {Promise<Model>} - The Mongoose model
 */
export async function getOrCreateModel(objectName) {
  const collectionName = `custom_${objectName}`;

  // Check cache first
  if (modelCache.has(collectionName)) {
    // Check if model is still registered with mongoose
    try {
      return mongoose.model(collectionName);
    } catch (e) {
      // Model not registered, recreate it
      modelCache.delete(collectionName);
    }
  }

  // Find the custom object definition
  const customObject = await CustomObject.findOne({
    $or: [
      { name: objectName },
      { _id: mongoose.Types.ObjectId.isValid(objectName) ? objectName : null }
    ]
  });

  if (!customObject) {
    throw new Error(`Custom object '${objectName}' not found`);
  }

  // Get all fields for this object
  const fields = await CustomField.find({ object: customObject._id })
    .sort({ order: 1, createdAt: 1 });

  // Build schema
  const schema = buildSchemaFromFields(fields);

  // Create model
  const model = mongoose.model(collectionName, schema, collectionName);
  modelCache.set(collectionName, model);

  return model;
}

/**
 * Get custom object definition with fields
 * @param {string} objectName - The name of the custom object
 * @returns {Promise<Object>} - The custom object with fields
 */
export async function getObjectDefinition(objectName) {
  const customObject = await CustomObject.findOne({
    $or: [
      { name: objectName },
      { _id: mongoose.Types.ObjectId.isValid(objectName) ? objectName : null }
    ]
  });

  if (!customObject) {
    throw new Error(`Custom object '${objectName}' not found`);
  }

  const fields = await CustomField.find({ object: customObject._id, active: true })
    .sort({ order: 1, createdAt: 1 });

  return {
    ...customObject.toObject(),
    fields,
  };
}

/**
 * Clear model cache (useful for testing)
 */
export function clearModelCache() {
  modelCache.clear();
}