const mongoose = require('mongoose');

// Define the Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    }
});

// Create the Enrollment model
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
