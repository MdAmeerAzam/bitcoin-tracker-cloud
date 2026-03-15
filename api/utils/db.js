const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://postgres.ybnpnpisvalswxyjjfvx:Qzh3nc8S%40UQezjc@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
