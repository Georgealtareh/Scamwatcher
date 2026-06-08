const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

const SCRAPER_PATH = path.join(__dirname, '../../scraper/scraper.py');

function runScraper() {
    console.log(`[${new Date().toISOString()}] Starting scheduled scraper run...`);
    const pythonProcess = spawn('python3', [SCRAPER_PATH]);

    pythonProcess.stdout.on('data', (data) => {
        // console.log(`Scraper STDOUT: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Scraper STDERR: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`[${new Date().toISOString()}] Scraper run finished with code ${code}`);
    });
}

function init() {
    // Run immediately on startup
    runScraper();

    // Schedule to run every hour
    cron.schedule('0 * * * *', () => {
        runScraper();
    });

    console.log('Scraper scheduler initialized (running every hour)');
}

module.exports = { init };
