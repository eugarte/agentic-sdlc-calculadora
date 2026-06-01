const mysql = require('mysql2/promise');
const { parse } = require('url');

// Check required environment variable
if (!process.env.MYSQL_URL && !process.env.DATABASE_URL) {
    throw new Error('MYSQL_URL or DATABASE_URL environment variable required');
}

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const parsedUrl = parse(dbUrl, true);

// Create connection pool
const pool = mysql.createPool({
    host: parsedUrl.hostname || process.env.MYSQL_HOST,
    port: parsedUrl.port || process.env.MYSQL_PORT || 3306,
    user: parsedUrl.auth?.split(':')[0] || process.env.MYSQL_USER,
    password: parsedUrl.auth?.split(':')[1] || process.env.MYSQL_PASSWORD,
    database: parsedUrl.pathname?.replace('/', '') || process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ensure calculations table exists
async function initializeDatabase() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS calculations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operation VARCHAR(20) NOT NULL,
                a DECIMAL(10, 2) NOT NULL,
                b DECIMAL(10, 2) NOT NULL,
                result DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized - calculations table ready');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

initializeDatabase().catch(console.error);

module.exports = {
    pool,
    query: async (sql, params) => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(sql, params);
            return rows;
        } finally {
            connection.release();
        }
    }
};
