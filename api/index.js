const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const path = require('path');
const { syncJob } = require('./sync');
const { performBackup } = require('./backup');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API Endpoint to fetch 4H data for the frontend
app.get('/api/data', (req, res) => {
    db.all(
        "SELECT * FROM klines ORDER BY timestamp DESC LIMIT 100",
        [],
        (err, rows) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Failed to fetch 4H data." });
            }
            res.json(rows);
        }
    );
});

// API Endpoint to fetch 12H data for the frontend
app.get('/api/data/12h', (req, res) => {
    db.all(
        "SELECT * FROM klines_12h ORDER BY timestamp DESC LIMIT 100",
        [],
        (err, rows) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Failed to fetch 12H data." });
            }
            res.json(rows);
        }
    );
});

// API Endpoint to fetch Daily data for the frontend
app.get('/api/data/daily', (req, res) => {
    db.all(
        "SELECT * FROM klines_daily ORDER BY timestamp DESC LIMIT 100",
        [],
        (err, rows) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Failed to fetch Daily data." });
            }
            res.json(rows);
        }
    );
});

// API Endpoint to fetch Weekly data for the frontend
app.get('/api/data/weekly', (req, res) => {
    db.all(
        "SELECT * FROM klines_weekly ORDER BY timestamp DESC LIMIT 100",
        [],
        (err, rows) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Failed to fetch Weekly data." });
            }
            res.json(rows);
        }
    );
});

// API Endpoint to fetch Monthly data for the frontend
app.get('/api/data/monthly', (req, res) => {
    db.all(
        "SELECT * FROM klines_monthly ORDER BY timestamp DESC LIMIT 100",
        [],
        (err, rows) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Failed to fetch Monthly data." });
            }
            res.json(rows);
        }
    );
});

// Immediately perform a sync when starting the server
syncJob('240', 'klines').then(() => {
    return syncJob('720', 'klines_12h');
}).then(() => {
    return syncJob('D', 'klines_daily');
}).then(() => {
    return syncJob('W', 'klines_weekly');
}).then(() => {
    return syncJob('M', 'klines_monthly');
});

// Schedule to run every 5 minutes for all timeframes
cron.schedule('*/5 * * * *', () => {
    console.log("Running scheduled 5-minute Bybit sync for all timeframes.");
    syncJob('240', 'klines').then(() => {
        return syncJob('720', 'klines_12h');
    }).then(() => {
        return syncJob('D', 'klines_daily');
    }).then(() => {
        return syncJob('W', 'klines_weekly');
    }).then(() => {
        return syncJob('M', 'klines_monthly');
    });
});

// Schedule Google Sheets Backup every 4 hours starting at 00:00 UTC (0, 4, 8, 12, 16, 20)
cron.schedule('0 0,4,8,12,16,20 * * *', () => {
    console.log("Running scheduled 4-hour Google Sheets backup.");
    performBackup();
}, { timezone: "UTC" });

app.listen(PORT, () => {
    console.log(`Bitcoin Futures Tracker API running at http://localhost:${PORT}`);
});
