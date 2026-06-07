const express = require('express');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

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
