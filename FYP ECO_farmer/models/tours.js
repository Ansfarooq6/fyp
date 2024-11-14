const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const farmTourSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    highlights: {
        type: [String],
        default: [],
        required: true,
    },
    date: {
        type: Date,
        required : true,
    },
    location: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    maxParticipants: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    slots: {
        type: [String],
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    }
});

const FarmTour = mongoose.model('FarmTour', farmTourSchema);

module.exports = FarmTour;
