const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const followUpSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  note: { type: String, trim: true, default: '' },
  done: { type: Boolean, default: false },
});

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    source: { type: String, trim: true, lowercase: true, default: 'website' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not-interested', 'converted'],
      default: 'new',
    },
    message: { type: String, trim: true, default: '' },
    notes: [noteSchema],
    followUps: [followUpSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
