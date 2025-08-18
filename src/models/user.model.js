// npm i mysql2
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'book_manager',
    port:     Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true, // trả date/time dạng string để dễ format
});

module.exports = pool;
