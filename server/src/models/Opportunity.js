import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Opportunity name is required'],
      trim: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    amount: {
      type: Number,
      default: 0,
    },
    stage: {
      type: String,
      enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      default: 'Prospecting',
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    closeDate: {
      type: Date,
      required: [true, 'Close date is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
opportunitySchema.index({ name: 'text' });

// Auto-set probability based on stage
opportunitySchema.pre('save', function (next) {
  const stageProbability = {
    'Prospecting': 10,
    'Qualification': 20,
    'Proposal': 50,
    'Negotiation': 75,
    'Closed Won': 100,
    'Closed Lost': 0,
  };

  if (this.isModified('stage')) {
    this.probability = stageProbability[this.stage];
  }
  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

export default Opportunity;