const pool = require('./utils/db');

module.exports = async function(req, res) {
    try {
        res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        const { rows } = await pool.query('SELECT * FROM klines_12h ORDER BY timestamp DESC LIMIT 100');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
