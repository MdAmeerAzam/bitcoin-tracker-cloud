const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const pool = require('./utils/db');

// Need to safely handle the Vercel environment vs Local environment for the JSON key payload
let credentials;
try {
    const credsPath = path.resolve(__dirname, 'credentials.json');
    if (fs.existsSync(credsPath)) {
        credentials = require(credsPath);
    } else {
        // Fallback to process.env for Vercel production hosting
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
    }
} catch (e) {
    console.warn("Could not load Google Credentials. Backup may fail if env vars aren't set.");
}

const SPREADSHEET_ID = '1ZzU-RkONy5fofE8s7XJ4M7dE6_f-O4yVb6M3kX0H88s';

async function executeBackup() {
    if (!credentials.client_email || !credentials.private_key) {
        throw new Error("Missing Google Service Account credentials.");
    }

    const serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    console.log(`Loaded Google Doc: ${doc.title}`);

    const tables = ['klines', 'klines_12h', 'klines_daily', 'klines_weekly', 'klines_monthly'];

    for (const table of tables) {
        const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY timestamp ASC`);
        if (rows.length === 0) continue;

        let sheet = doc.sheetsByTitle[table];
        if (!sheet) {
            sheet = await doc.addSheet({ title: table });
            await sheet.setHeaderRow(['timestamp', 'date_utc', 'open', 'high', 'low', 'sar1', 'sar2', 'closeValue', 'closePts', 'closePct', 'closeVol']);
        }

        await sheet.clearRows();

        const sheetRows = rows.map(r => ({
            timestamp: r.timestamp,
            date_utc: new Date(Number(r.timestamp)).toISOString(),
            open: r.open,
            high: r.high,
            low: r.low,
            sar1: r.sar1,
            sar2: r.sar2,
            closeValue: r.closevalue,
            closePts: r.closepts,
            closePct: r.closepct,
            closeVol: r.closevol
        }));

        await sheet.addRows(sheetRows);
        console.log(`Successfully backed up ${sheetRows.length} rows from Postgres ${table} to Google Sheets tab '${table}'.`);
    }
}

// Serverless Handler
module.exports = async function(req, res) {
    try {
        await executeBackup();
        res.status(200).json({ success: true, message: "Google Sheets Backup Executed Successfully" });
    } catch (err) {
        console.error("Backup failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
