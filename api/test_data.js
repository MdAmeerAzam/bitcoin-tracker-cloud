const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bitcoin.db');
const db = new sqlite3.Database(dbPath);

const tables = ['klines', 'klines_12h', 'klines_daily', 'klines_weekly', 'klines_monthly'];

console.log("=== COMPREHENSIVE DATA TEST ===\n");

function testTable(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 2`, (err, rows) => {
            if (err) {
                console.error(`Error querying ${tableName}:`, err.message);
                return resolve();
            }
            
            console.log(`--- Table: ${tableName} ---`);
            console.log(`Total rows fetched in this test: ${rows.length}`);
            
            if (rows.length >= 2) {
                const latest = rows[0];
                const prev = rows[1];
                
                console.log(`Latest Candle Date (UTC): ${new Date(latest.timestamp).toUTCString()}`);
                console.log(`Open: ${latest.open}, High: ${latest.high}, Low: ${latest.low}, Close: ${latest.closeValue}`);
                console.log(`1-SAR: ${latest.sar1}, 2-SAR: ${latest.sar2}`);
                console.log(`Volume (k): ${latest.closeVol}`);
                
                // Verify Pts and % Calculation
                // Pts = Current Close - Previous Close
                const expectedPts = latest.closeValue - prev.closeValue;
                // % = (Pts / Previous Close) * 100
                const expectedPct = (expectedPts / prev.closeValue) * 100;
                
                console.log(`Stored Pts: ${latest.closePts.toFixed(2)}, Expected Pts: ${expectedPts.toFixed(2)}`);
                console.log(`Stored Pct: ${latest.closePct.toFixed(2)}%, Expected Pct: ${expectedPct.toFixed(2)}%`);

                if (Math.abs(latest.closePts - expectedPts) > 0.01) {
                    console.error("❌ Pts calculation mismatch!");
                } else {
                    console.log("✅ Pts calculation is correct.");
                }

                if (Math.abs(latest.closePct - expectedPct) > 0.01) {
                    console.error("❌ Pct calculation mismatch!");
                } else {
                    console.log("✅ Pct calculation is correct.");
                }
            } else {
                console.log("Not enough data to verify calculations.");
            }
            console.log("\n");
            resolve();
        });
    });
}

async function runTests() {
    for (const table of tables) {
        await testTable(table);
    }
    db.close();
}

runTests();
