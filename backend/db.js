const { spawnSync } = require('child_process');

function query(sql, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const child = spawnSync('team-db', [sql], { encoding: 'utf8' });
            
            if (child.error) {
                throw child.error;
            }

            if (child.status !== 0) {
                // If it's a locking error, we might want to retry
                if (child.stderr.includes('Locking error') || child.stderr.includes('database is locked')) {
                    console.warn(`Database locked, retrying (${i + 1}/${retries})...`);
                    spawnSync('sleep', ['1']);
                    continue;
                }
                throw new Error(child.stderr || child.stdout);
            }

            const result = child.stdout.trim();
            if (!result) return [];
            return JSON.parse(result);
        } catch (error) {
            if (i === retries - 1) {
                console.error('Database query error after retries:', error.message);
                throw error;
            }
            console.warn(`Database query failed, retrying (${i + 1}/${retries})...: ${error.message}`);
            spawnSync('sleep', ['1']);
        }
    }
}

function escape(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/'/g, "''");
}

module.exports = { query, escape };
