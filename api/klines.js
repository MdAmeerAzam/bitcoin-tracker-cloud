const pool = require('./utils/db');

module.exports = async function(req, res) {
    try {
        const { rows } = await pool.query('SELECT * FROM klines ORDER BY timestamp DESC LIMIT 100');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
