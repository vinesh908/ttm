const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// helper - make a token
function makeToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/signup
router.post('/signup',
    [
        body('name').trim().isLength({ min: 2 }).withMessage('name too short'),
        body('email').isEmail().withMessage('invalid email').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('password min 6 chars')
    ],
    async (req, res) => {
        const errs = validationResult(req);
        if (!errs.isEmpty()) {
            return res.status(400).json({ errors: errs.array() });
        }

        try {
            const { name, email, password, role } = req.body;

            // check existing
            const exists = await User.findOne({ email });
            if (exists) {
                return res.status(400).json({ message: 'user already exists' });
            }

            // first user becomes admin (small hack but useful)
            const userCount = await User.countDocuments();
            const finalRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'member');

            const user = await User.create({
                name,
                email,
                password,
                role: finalRole
            });

            const token = makeToken(user._id);
            res.status(201).json({
                token,
                user
            });
        } catch (e) {
            console.log('signup err', e);
            res.status(500).json({ message: 'signup failed' });
        }
    }
);

// POST /api/auth/login
router.post('/login',
    [
        body('email').isEmail().withMessage('invalid email'),
        body('password').notEmpty().withMessage('password required')
    ],
    async (req, res) => {
        const errs = validationResult(req);
        if (!errs.isEmpty()) {
            return res.status(400).json({ errors: errs.array() });
        }

        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(400).json({ message: 'invalid credentials' });
            }
            const ok = await user.matchPassword(password);
            if (!ok) {
                return res.status(400).json({ message: 'invalid credentials' });
            }
            const token = makeToken(user._id);
            res.json({ token, user });
        } catch (e) {
            console.log('login err', e);
            res.status(500).json({ message: 'login failed' });
        }
    }
);

// GET /api/auth/me - get current user
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;
