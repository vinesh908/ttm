const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// helper: check if user can access a project
async function canAccessProject(project, user) {
    if (user.role === 'admin') return true;
    if (project.owner.toString() === user._id.toString()) return true;
    return project.members.some(m => m.toString() === user._id.toString());
}

// GET /api/tasks - all tasks user can see, with optional filters
router.get('/', async (req, res) => {
    try {
        const filter = {};

        // optional query filters
        if (req.query.project) filter.project = req.query.project;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
        if (req.query.mine === 'true') filter.assignedTo = req.user._id;

        // for non-admin: limit to projects they can see
        if (req.user.role !== 'admin') {
            const projects = await Project.find({
                $or: [
                    { owner: req.user._id },
                    { members: req.user._id }
                ]
            }).select('_id');
            const ids = projects.map(p => p._id);
            filter.project = filter.project
                ? (ids.some(id => id.toString() === filter.project) ? filter.project : null)
                : { $in: ids };
            if (filter.project === null) return res.json([]);
        }

        const tasks = await Task.find(filter)
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/tasks/dashboard - quick summary stats
router.get('/dashboard', async (req, res) => {
    try {
        // build the user-accessible projects list once
        let projectFilter = {};
        if (req.user.role !== 'admin') {
            const projects = await Project.find({
                $or: [
                    { owner: req.user._id },
                    { members: req.user._id }
                ]
            }).select('_id');
            projectFilter = { project: { $in: projects.map(p => p._id) } };
        }

        const allTasks = await Task.find(projectFilter);
        const now = new Date();

        const stats = {
            total: allTasks.length,
            todo: allTasks.filter(t => t.status === 'todo').length,
            inProgress: allTasks.filter(t => t.status === 'in-progress').length,
            done: allTasks.filter(t => t.status === 'done').length,
            overdue: allTasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now).length,
            myTasks: allTasks.filter(t => t.assignedTo && t.assignedTo.toString() === req.user._id.toString()).length
        };

        res.json(stats);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!task) return res.status(404).json({ message: 'not found' });

        const allowed = await canAccessProject(task.project, req.user);
        if (!allowed) return res.status(403).json({ message: 'access denied' });

        res.json(task);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/tasks
router.post('/',
    [
        body('title').trim().notEmpty().withMessage('title required'),
        body('project').notEmpty().withMessage('project required')
    ],
    async (req, res) => {
        const errs = validationResult(req);
        if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

        try {
            const proj = await Project.findById(req.body.project);
            if (!proj) return res.status(400).json({ message: 'project not found' });

            const allowed = await canAccessProject(proj, req.user);
            if (!allowed) return res.status(403).json({ message: 'cant create task here' });

            const task = await Task.create({
                title: req.body.title,
                description: req.body.description || '',
                project: proj._id,
                assignedTo: req.body.assignedTo || null,
                status: req.body.status || 'todo',
                priority: req.body.priority || 'medium',
                dueDate: req.body.dueDate || null,
                createdBy: req.user._id
            });

            const populated = await Task.findById(task._id)
                .populate('project', 'name')
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email');

            res.status(201).json(populated);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
);

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('project');
        if (!task) return res.status(404).json({ message: 'not found' });

        const allowed = await canAccessProject(task.project, req.user);
        if (!allowed) return res.status(403).json({ message: 'access denied' });

        // members can only update status of tasks assigned to them
        // admin/owner can update everything
        const isAdminOrOwner = req.user.role === 'admin' ||
            task.project.owner.toString() === req.user._id.toString();

        if (!isAdminOrOwner) {
            // only allow status update by assigned user
            if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'only assigned user can update' });
            }
            // limit fields
            if (req.body.status) task.status = req.body.status;
        } else {
            const allowedFields = ['title', 'description', 'assignedTo', 'status', 'priority', 'dueDate'];
            allowedFields.forEach(f => {
                if (req.body[f] !== undefined) task[f] = req.body[f];
            });
        }

        await task.save();
        const updated = await Task.findById(task._id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        res.json(updated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/tasks/:id (admin or project owner)
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('project');
        if (!task) return res.status(404).json({ message: 'not found' });

        const isAdminOrOwner = req.user.role === 'admin' ||
            task.project.owner.toString() === req.user._id.toString();

        if (!isAdminOrOwner) {
            return res.status(403).json({ message: 'admin or owner only' });
        }

        await task.deleteOne();
        res.json({ message: 'task deleted' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
