const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bitcoin.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS klines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER UNIQUE,
            open REAL,
            high REAL,
            low REAL,
            sar1 REAL,
            sar2 REAL,
            closeValue REAL,
            closePts REAL,
            closePct REAL,
            closeVol REAL
        )`, (err) => {
            if (err) {
                console.error('Error creating 4H table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS klines_12h (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER UNIQUE,
            open REAL,
            high REAL,
            low REAL,
            sar1 REAL,
            sar2 REAL,
            closeValue REAL,
            closePts REAL,
            closePct REAL,
            closeVol REAL
        )`, (err) => {
            if (err) {
                console.error('Error creating 12H table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS klines_daily (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER UNIQUE,
            open REAL,
            high REAL,
            low REAL,
            sar1 REAL,
            sar2 REAL,
            closeValue REAL,
            closePts REAL,
            closePct REAL,
            closeVol REAL
        )`, (err) => {
            if (err) {
                console.error('Error creating Daily table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS klines_weekly (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER UNIQUE,
            open REAL,
            high REAL,
            low REAL,
            sar1 REAL,
            sar2 REAL,
            closeValue REAL,
            closePts REAL,
            closePct REAL,
            closeVol REAL
        )`, (err) => {
            if (err) {
                console.error('Error creating Weekly table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS klines_monthly (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER UNIQUE,
            open REAL,
            high REAL,
            low REAL,
            sar1 REAL,
            sar2 REAL,
            closeValue REAL,
            closePts REAL,
            closePct REAL,
            closeVol REAL
        )`, (err) => {
            if (err) {
                console.error('Error creating Monthly table', err.message);
            }
        });
    }
});

module.exports = db;
