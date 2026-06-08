const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'scamwatch-super-secret-key';

async function signup(email, password, fullName) {
    // Check if user already exists
    const existingUser = db.query(`SELECT * FROM users WHERE email = '${db.escape(email)}'`);
    if (existingUser.length > 0) {
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    // Insert user
    const sql = `INSERT INTO users (id, email, full_name, password_hash, is_premium) 
                 VALUES ('${id}', '${db.escape(email)}', '${db.escape(fullName)}', '${passwordHash}', 0)`;
    db.query(sql);

    // Create token
    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '24h' });

    return {
        user: { id, email, fullName, is_premium: 0 },
        token
    };
}

async function login(email, password) {
    const users = db.query(`SELECT * FROM users WHERE email = '${db.escape(email)}'`);
    if (users.length === 0) {
        throw new Error('Invalid credentials');
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    return {
        user: { 
            id: user.id, 
            email: user.email, 
            fullName: user.full_name, 
            is_premium: user.is_premium 
        },
        token
    };
}

function verifyToken(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
}

module.exports = {
    signup,
    login,
    verifyToken
};
