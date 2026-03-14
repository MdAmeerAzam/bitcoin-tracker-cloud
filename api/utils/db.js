const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://postgres:Qzh3nc8S%40UQezjc@db.ybnpnpisvalswxyjjfvx.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
