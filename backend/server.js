// main server file
// honestly this used to be in app.js but moved it here so railway picks it up easily

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// middleware
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));
app.use(express.json());

// quick request log so we can see whats happening when something breaks
app.use((req, res, next) => {
    console.log(req.method + ' ' + req.url);
    next();
});

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// health check (railway uses this)
app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date() });
});

// serve react build in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'frontend', 'build');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}

// error handler - just a basic one
app.use((err, req, res, next) => {
    console.log('err:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'something went wrong'
    });
});

const PORT = process.env.PORT || 5000;

// connect to mongo first then start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('mongo connected');
        app.listen(PORT, () => {
            console.log('server running on port ' + PORT);
        });
    })
    .catch(err => {
        console.log('mongo connection failed:', err.message);
        process.exit(1);
    });
