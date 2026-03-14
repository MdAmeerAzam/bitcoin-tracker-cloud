const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

const dbLocal = new sqlite3.Database('./bitcoin.db');

// The password string parsing
const uri = "postgresql://postgres:Qzh3nc8S%40UQezjc@db.ybnpnpisvalswxyjjfvx.supabase.co:5432/postgres";

const pgClient = new Client({
    connectionString: uri,
    ssl: { rejectUnauthorized: false }
});

const tables = ['klines', 'klines_12h', 'klines_daily', 'klines_weekly', 'klines_monthly'];

async function migrate() {
    try {
        await pgClient.connect();
        console.log("Connected to Supabase PostgreSQL!");

        for (const table of tables) {
            // Create table
            const createQuery = `
                CREATE TABLE IF NOT EXISTS ${table} (
                    id SERIAL PRIMARY KEY,
                    timestamp BIGINT UNIQUE,
                    open REAL,
                    high REAL,
                    low REAL,
                    sar1 REAL,
                    sar2 REAL,
                    closeValue REAL,
                    closePts REAL,
                    closePct REAL,
                    closeVol REAL
                );
            `;
            await pgClient.query(createQuery);
            console.log(`Table ${table} ensured in Postgres.`);

            // Read from SQLite
            const rows = await new Promise((resolve, reject) => {
                dbLocal.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log(`Found ${rows.length} rows in local SQLite ${table}. Inserting to Postgres...`);

            if (rows.length > 0) {
                // Bulk insert
                const values = rows.map(r => `(${r.timestamp}, ${r.open}, ${r.high}, ${r.low}, ${r.sar1}, ${r.sar2}, ${r.closeValue}, ${r.closePts}, ${r.closePct}, ${r.closeVol})`).join(', ');
                
                const insertQuery = `
                    INSERT INTO ${table} (timestamp, open, high, low, sar1, sar2, closeValue, closePts, closePct, closeVol)
                    VALUES ${values}
                    ON CONFLICT (timestamp) DO NOTHING;
                `;
                
                await pgClient.query(insertQuery);
                console.log(`Migrated ${rows.length} rows to ${table}.`);
            }
        }

        console.log("Migration complete!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pgClient.end();
        dbLocal.close();
    }
}

migrate();
