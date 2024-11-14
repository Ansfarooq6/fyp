const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  courseName: {
    type: String,
    required: true
  },
  availableSlots: {
    type: Number,
    required: true
  },
  availableDays: {
    type: [String],
    required: true
  },
  mode: {
    type: String,
    required: true
  },
  courseDuration: {
    type: String,
    required: true
  },
  courseFee: {
    type: Number,
    required: true
  },
  lastDateToApply: {
    type: Date,
    required: true
  },
  courseDescription: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // Or 'Farmer' depending on your setup
    required: true
  }
});

module.exports = mongoose.model('Course', courseSchema);
