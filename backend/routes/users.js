const express = require('express');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/users - list all (used for assigning tasks / adding members)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('name email role').sort({ name: 1 });
        res.json(users);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// PUT /api/users/:id/role - admin only, change role
router.put('/:id/role', adminOnly, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ message: 'invalid role' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'not found' });

        user.role = role;
        await user.save();
        res.json(user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/users/:id - admin only
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'cant delete yourself' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'not found' });
        res.json({ message: 'user removed' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
