const axios = require('axios');
const technicalIndicators = require('technicalindicators');
const pool = require('./utils/db');

const BYBIT_API_URL = 'https://api.bybit.com/v5/market/kline';
const SYMBOL = 'BTCUSDT';
const LIMIT = 200; 

async function fetchHistoricalData(interval) {
    try {
        const response = await axios.get(BYBIT_API_URL, {
            params: {
                category: 'linear',
                symbol: SYMBOL,
                interval: interval,
                limit: LIMIT
            }
        });
        
        if (response.data.retCode !== 0) {
           throw new Error(`Bybit API Error: ${response.data.retMsg}`);
        }

        const rawKlines = response.data.result.list.reverse();
        
        const klines = rawKlines.map(kline => ({
            timestamp: parseInt(kline[0]),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5])
        }));

        return klines;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

async function processAndSaveData(klines, tableName) {
    if (klines.length === 0) return;

    const oldestTimestamp = klines[0].timestamp; 
    
    // Fetch from PG
    const { rows: existingRows } = await pool.query(`SELECT timestamp, sar1 FROM ${tableName} WHERE timestamp >= $1`, [oldestTimestamp]);
    
    const existingSarMap = new Map();
    existingRows.forEach(row => {
        existingSarMap.set(Number(row.timestamp), row.sar1);
    });

    const high = klines.map(k => k.high);
    const low = klines.map(k => k.low);
    const close = klines.map(k => k.close);

    const inputSAR = {
        high: high,
        low: low,
        step: 0.02,
        max: 0.2,
    };
    
    const sarResults = technicalIndicators.PSAR.calculate(inputSAR);
    const sarOffset = klines.length - sarResults.length;

    // We do bulk upsert in Postgres using UNNEST or building a large query
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        for (let i = 0; i < klines.length; i++) {
            const kline = klines[i];
            
            let sar1 = null;
            let sar2 = null; 
            
            if (i >= sarOffset) {
                const currentCalcSar = sarResults[i - sarOffset];
                const roundedCalcSar = Number(currentCalcSar.toFixed(2));
                
                if (existingSarMap.has(kline.timestamp)) {
                    sar1 = existingSarMap.get(kline.timestamp);
                } else {
                    sar1 = roundedCalcSar;
                }
                
                if (roundedCalcSar !== sar1) {
                    sar2 = roundedCalcSar;
                } else {
                    sar2 = 0;
                }
            }
            
            let closePts = 0;
            let closePct = 0;
            if (i > 0) {
                const prevClose = klines[i - 1].close;
                closePts = kline.close - prevClose;
                closePct = (closePts / prevClose) * 100;
            }

            const closeVolK = kline.volume / 1000;

            const upsertQuery = `
                INSERT INTO ${tableName} (timestamp, open, high, low, sar1, sar2, closeValue, closePts, closePct, closeVol) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (timestamp) DO UPDATE SET
                    open = EXCLUDED.open,
                    high = EXCLUDED.high,
                    low = EXCLUDED.low,
                    sar1 = EXCLUDED.sar1,
                    sar2 = EXCLUDED.sar2,
                    closeValue = EXCLUDED.closeValue,
                    closePts = EXCLUDED.closePts,
                    closePct = EXCLUDED.closePct,
                    closeVol = EXCLUDED.closeVol;
            `;

            await client.query(upsertQuery, [
                kline.timestamp,
                kline.open,
                kline.high,
                kline.low,
                sar1 ? Number(sar1.toFixed(2)) : 0,
                sar2 !== null ? Number(sar2.toFixed(2)) : 0,
                kline.close,
                Number(closePts.toFixed(2)),
                Number(closePct.toFixed(2)),
                Number(closeVolK.toFixed(2))
            ]);
        }

        await client.query('COMMIT');
        console.log(`Successfully synced ${klines.length} klines to ${tableName}.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("PG Commit error", e);
        throw e;
    } finally {
        client.release();
    }
}

async function syncJob(interval, tableName) {
    console.log(`[${new Date().toISOString()}] Starting Data Sync for ${tableName} (Interval: ${interval})...`);
    const klines = await fetchHistoricalData(interval);
    await processAndSaveData(klines, tableName);
}

// Serverless Handler
module.exports = async function(req, res) {
    try {
        await syncJob('240', 'klines');
        await syncJob('720', 'klines_12h');
        await syncJob('D', 'klines_daily');
        await syncJob('W', 'klines_weekly');
        await syncJob('M', 'klines_monthly');
        
        res.status(200).json({ success: true, message: "Sync complete for all timeframes." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};
