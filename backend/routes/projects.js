const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// all routes here need auth
router.use(protect);

// GET /api/projects
// admin sees all, members see only ones they belong to
router.get('/', async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query = {
                $or: [
                    { owner: req.user._id },
                    { members: req.user._id }
                ]
            };
        }
        const projects = await Project.find(query)
            .populate('owner', 'name email')
            .populate('members', 'name email')
            .sort({ createdAt: -1 });

        res.json(projects);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members', 'name email');

        if (!project) return res.status(404).json({ message: 'not found' });

        // check access
        const isOwner = project.owner._id.toString() === req.user._id.toString();
        const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
        if (req.user.role !== 'admin' && !isOwner && !isMember) {
            return res.status(403).json({ message: 'access denied' });
        }

        res.json(project);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/projects (admin only)
router.post('/',
    adminOnly,
    [
        body('name').trim().notEmpty().withMessage('name required')
    ],
    async (req, res) => {
        const errs = validationResult(req);
        if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

        try {
            const { name, description, members } = req.body;
            const proj = await Project.create({
                name,
                description: description || '',
                owner: req.user._id,
                members: members || []
            });
            const populated = await Project.findById(proj._id)
                .populate('owner', 'name email')
                .populate('members', 'name email');
            res.status(201).json(populated);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
);

// PUT /api/projects/:id (admin or owner)
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'not found' });

        const isOwner = project.owner.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'only admin/owner can update' });
        }

        const allowed = ['name', 'description', 'members'];
        allowed.forEach(f => {
            if (req.body[f] !== undefined) project[f] = req.body[f];
        });

        await project.save();
        const populated = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('members', 'name email');
        res.json(populated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/projects/:id (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'not found' });

        // delete all tasks under this project too
        await Task.deleteMany({ project: project._id });
        await project.deleteOne();
        res.json({ message: 'project deleted' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/projects/:id/members - add member (admin or owner)
router.post('/:id/members', async (req, res) => {
    try {
        const { userId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'not found' });

        const isOwner = project.owner.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'not allowed' });
        }

        // make sure user exists
        const user = await User.findById(userId);
        if (!user) return res.status(400).json({ message: 'user not found' });

        // skip if already member
        if (!project.members.some(m => m.toString() === userId)) {
            project.members.push(userId);
            await project.save();
        }
        const populated = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('members', 'name email');
        res.json(populated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'not found' });

        const isOwner = project.owner.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'not allowed' });
        }

        project.members = project.members.filter(m => m.toString() !== req.params.userId);
        await project.save();
        const populated = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('members', 'name email');
        res.json(populated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
