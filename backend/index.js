const express = require('express');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const db = require('./db');
const alerts = require('./services/alerts');
const scheduler = require('./services/scheduler');
const auth = require('./services/auth');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Initialize scheduler
scheduler.init();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth Endpoints
app.post('/api/auth/signup', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').isString().trim().notEmpty(),
    validate
], async (req, res) => {
    const { email, password, fullName } = req.body;
    try {
        const result = await auth.signup(email, password, fullName);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
    validate
], async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await auth.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/auth/me', auth.verifyToken, (req, res) => {
    try {
        const user = db.query(`SELECT id, email, full_name as fullName, is_premium FROM users WHERE id = '${req.user.id}'`);
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/user/premium', auth.verifyToken, (req, res) => {
    const { isPremium } = req.body;
    try {
        const value = isPremium ? 1 : 0;
        db.query(`UPDATE users SET is_premium = ${value} WHERE id = '${req.user.id}'`);
        res.json({ message: `Premium status updated to ${isPremium}`, is_premium: value });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get('/api/scams', (req, res) => {
    try {
        const scams = db.query("SELECT * FROM scams WHERE status = 'active' ORDER BY date_detected DESC");
        res.json(scams);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/scams/:id', [
    param('id').isString().trim().notEmpty(),
    validate
], (req, res) => {
    try {
        const id = db.escape(req.params.id);
        const scam = db.query(`SELECT * FROM scams WHERE id = '${id}'`);
        if (scam.length === 0) {
            return res.status(404).json({ error: 'Scam not found' });
        }
        res.json(scam[0]);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/scams', [
    body('id').isString().trim().notEmpty(),
    body('title').isString().trim().notEmpty(),
    body('description').optional().isString().trim(),
    body('source').optional().isString().trim(),
    body('risk_level').optional().isIn(['low', 'medium', 'high']),
    body('category').optional().isString().trim(),
    body('url').optional().isURL(),
    validate
], (req, res) => {
    const { id, title, description, source, risk_level, category, url } = req.body;
    try {
        const sql = `INSERT INTO scams (id, title, description, source, risk_level, category, url) 
                  VALUES (
                    '${db.escape(id)}', 
                    '${db.escape(title)}', 
                    '${db.escape(description)}', 
                    '${db.escape(source)}', 
                    '${db.escape(risk_level)}', 
                    '${db.escape(category)}', 
                    '${db.escape(url)}'
                  )`;
        db.query(sql);
        // Process alerts asynchronously
        alerts.processAlerts({ id, title, description, source, risk_level, category, url }).catch(err => {
            console.error('Error processing alerts:', err);
        });
        res.status(201).json({ message: 'Scam added' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Scam ID already exists' });
        }
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});
