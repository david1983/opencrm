import mongoose from 'mongoose';

const FIELD_TYPES = [
  'Text',
  'Number',
  'Date',
  'DateTime',
  'Boolean',
  'Picklist',
  'MultiPicklist',
  'Lookup',
  'Email',
  'Phone',
  'Url',
  'Currency',
  'Percent',
  'TextArea',
  'LongTextArea',
];

const customFieldSchema = new mongoose.Schema(
  {
    object: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomObject',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
    },
    label: {
      type: String,
      required: [true, 'Field label is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: FIELD_TYPES,
      required: [true, 'Field type is required'],
    },
    required: {
      type: Boolean,
      default: false,
    },
    unique: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    options: [{
      value: String,
      label: String,
      default: Boolean,
    }],
    lookupObject: {
      type: String,
    },
    validation: {
      minLength: Number,
      maxLength: Number,
      minValue: Number,
      maxValue: Number,
      regex: String,
    },
    description: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique field name per object
customFieldSchema.index({ object: 1, name: 1 }, { unique: true });

const CustomField = mongoose.model('CustomField', customFieldSchema);

export { FIELD_TYPES };
export default CustomField;