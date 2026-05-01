const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'email required'],
        unique: true,
        lowercase: true,
        trim: true,
        // simple email check, good enough
        match: [/^\S+@\S+\.\S+$/, 'invalid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    }
}, { timestamps: true });

// hash password before save (only if changed)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (e) {
        next(e);
    }
});

// compare password helper
userSchema.methods.matchPassword = async function (entered) {
    return await bcrypt.compare(entered, this.password);
};

// dont send password back when converting to json
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
