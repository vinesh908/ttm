const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'project name is required'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        default: '',
        maxlength: 1000
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// virtual to count tasks (populated on demand)
projectSchema.virtual('taskCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project',
    count: true
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
