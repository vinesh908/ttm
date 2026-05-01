const jwt = require('jsonwebtoken');
const User = require('../models/User');

// verify the jwt token and attach user to request
async function protect(req, res, next) {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'no token, not authorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // grab user from db (so we get latest role etc)
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'user not found' });
        }
        req.user = user;
        next();
    } catch (e) {
        // token expired or invalid
        return res.status(401).json({ message: 'token invalid' });
    }
}

// admin only middleware
function adminOnly(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'admin only' });
}

module.exports = { protect, adminOnly };
