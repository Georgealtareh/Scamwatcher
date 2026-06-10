const { createClient } = require('@libsql/client');
const { spawnSync } = require('child_process');

let client;
if (process.env.TEAM_DB_URL && process.env.TEAM_DB_AUTH_TOKEN) {
    client = createClient({
        url: process.env.TEAM_DB_URL,
        authToken: process.env.TEAM_DB_AUTH_TOKEN,
    });
}

async function query(sql, retries = 3) {
    if (client) {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await client.execute(sql);
                // Convert rows to plain objects to match previous team-db output
                return result.rows.map(row => {
                    const obj = {};
                    for (const key in row) {
                        obj[key] = row[key];
                    }
                    return obj;
                });
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } else {
        // Fallback to team-db for sandbox environment if client isn't configured
        for (let i = 0; i < retries; i++) {
            try {
                const child = spawnSync('team-db', [sql], { encoding: 'utf8' });
                
                if (child.error) throw child.error;

                if (child.status !== 0) {
                    if (child.stderr.includes('Locking error') || child.stderr.includes('database is locked')) {
                        spawnSync('sleep', ['1']);
                        continue;
                    }
                    throw new Error(child.stderr || child.stdout);
                }

                const result = child.stdout.trim();
                if (!result) return [];
                return JSON.parse(result);
            } catch (error) {
                if (i === retries - 1) throw error;
                spawnSync('sleep', ['1']);
            }
        }
    }
}

function escape(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/'/g, "''");
}

module.exports = { query, escape };
