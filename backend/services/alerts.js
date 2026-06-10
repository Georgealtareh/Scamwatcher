const nodemailer = require('nodemailer');
const db = require('../db');
const fs = require('fs');
const path = require('path');

// Mock transporter for development
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mock_user',
        pass: 'mock_pass'
    }
});

const EMAIL_TEMPLATE_PATH = '/home/team/shared/design/premium/email-template.html';
const SMS_TEMPLATE_PATH = '/home/team/shared/design/premium/sms-template.txt';

const crypto = require('crypto');

async function sendEmailAlert(user, scam) {
    let html = '';
    try {
        html = fs.readFileSync(EMAIL_TEMPLATE_PATH, 'utf8');
        // Simple replacement
        html = html.replace(/"Microsoft Support" AI Voice Cloning Scam/g, scam.title);
        html = html.replace(/Scammers are using AI to mimic Microsoft support representatives. They call claiming your "security license has expired" and request remote access to your computer./g, scam.description);
        // In a real app, we'd use a templating engine like Handlebars or EJS
    } catch (e) {
        console.error('Error reading email template:', e);
        html = `<p>High Risk Scam Detected: ${scam.title}</p><p>${scam.description}</p>`;
    }

    const mailOptions = {
        from: '"ScamWatch Alerts" <alerts@scamwatch.test>',
        to: user.email,
        subject: `[URGENT] Scam Alert: ${scam.title} detected`,
        html: html
    };

    try {
        // console.log(`Sending email to ${user.email}...`);
        // await transporter.sendMail(mailOptions);
        console.log(`[MOCK] Email sent to ${user.email} for scam: ${scam.title}`);
        
        // Record in history
        db.query(`INSERT INTO alert_history (id, user_id, scam_id, channel) VALUES ('${crypto.randomUUID()}', '${user.id}', '${scam.id}', 'email')`);
    } catch (error) {
        console.error('Error sending email alert:', error);
    }
}

async function sendSMSAlert(user, scam) {
    if (!user.phone) return;

    let body = '';
    try {
        body = fs.readFileSync(SMS_TEMPLATE_PATH, 'utf8');
        body = body.replace(/New IRS Refund scam detected./g, `${scam.title} detected.`);
    } catch (e) {
        body = `[SCAMWATCH ALERT] High Risk: ${scam.title} detected. More details on our dashboard.`;
    }

    try {
        console.log(`[MOCK] SMS sent to ${user.phone}: ${body}`);
        
        // Record in history
        db.query(`INSERT INTO alert_history (id, user_id, scam_id, channel) VALUES ('${crypto.randomUUID()}', '${user.id}', '${scam.id}', 'sms')`);
    } catch (error) {
        console.error('Error sending SMS alert:', error);
    }
}

async function processAlerts(scam) {
    if (scam.risk_level.toLowerCase() !== 'high') return;

    console.log(`Processing alerts for high-risk scam: ${scam.title}`);

    try {
        // Find all premium users
        const users = db.query("SELECT * FROM users WHERE is_premium = 1");
        
        for (const user of users) {
            // Check if user is subscribed to this scam type or has no preference (all)
            const subs = db.query(`SELECT * FROM alert_subscriptions WHERE user_id = '${user.id}'`);
            const isSubscribed = subs.length === 0 || subs.some(s => s.scam_type === scam.category || s.scam_type === 'all');

            if (isSubscribed) {
                await sendEmailAlert(user, scam);
                await sendSMSAlert(user, scam);
            }
        }
    } catch (error) {
        console.error('Error processing alerts:', error);
    }
}

module.exports = {
    processAlerts
};
