/*Import thư viện mysql2 ở chế độ promise → cho phép dùng async/await thay vì callback
viết ngắn gon hơn*/
const mysql = require('mysql2/promise');
//Lấy các biến môi trường (config DB) từ file env.js
const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = require('./env');
//Pool giúp tái sử dụng kết nối, không phải mở/đóng DB liên tục cho mỗi query → hiệu suất cao
const pool = mysql.createPool({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS,
    database: DB_NAME, waitForConnections: true, connectionLimit: 10,namedPlaceholders: true
});
//Export pool ra ngoài để các file khác (controller, model) có thể import và dùng
module.exports = pool;
