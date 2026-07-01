const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    matchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    scheduledAt: { type: Date },
    startedAt:   { type: Date },
    endedAt:     { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);