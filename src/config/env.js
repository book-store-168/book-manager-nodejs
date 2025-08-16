// Nạp evn ở root dự án, dùng thư viện dotenv để đọc file .env nằm ở root dự án
// process.cwd() → thư mục hiện tại khi chạy app
// path.resolve(...) → tạo đường dẫn tuyệt đối đến file .env
// Nhờ vậy, tất cả biến trong .env sẽ có trong process.env
const path = require('path');
require('dotenv').config();

// Hàm tiện ích lấy biến môi trường
// Lấy biến môi trường process.env[name]
// Nếu không tồn tại → trả về giá trị mặc định def
function get(name, def = undefined) {
    const v = process.env[name];
    return v !== undefined ? v : def;
}
// Lấy biến và ép kiểu số (Number)
// Nếu không phải số → báo lỗi (giúp tránh bug khi PORT/DB_PORT bị nhập nhầm thành chữ)
function getNumber(name, def) {
    const v = Number(get(name, def));
    if (Number.isNaN(v)) throw new Error(`Env ${name} must be a number`);
    return v;
}
// Bắt buộc phải có biến (như SESSION_SECRET, DB_USER, DB_NAME)
// Nếu thiếu → throw Error, app sẽ không khởi động được (tránh lỗi bảo mật).
function requireEnv(name) {
    const v = get(name);
    if (v === undefined || v === '') {
        throw new Error(`Missing required env: ${name}`);
    }
    return v;
}
const config = {
    // App
    PORT: getNumber('PORT', 3000),
    NODE_ENV: get('NODE_ENV', 'development'),
    SESSION_SECRET: requireEnv('SESSION_SECRET'),

    // MySQL
    DB_HOST: requireEnv('DB_HOST'),
    DB_PORT: getNumber('DB_PORT', 3306),
    DB_USER: requireEnv('DB_USER'),
    DB_PASS: get('DB_PASS', ''),          // cho phép rỗng
    DB_NAME: requireEnv('DB_NAME'),

    // Redis
    REDIS_HOST: get('REDIS_HOST', '127.0.0.1'),
    REDIS_PORT: getNumber('REDIS_PORT', 6379),

    // SMTP (OTP)
    SMTP_HOST: get('SMTP_HOST', 'smtp.gmail.com'),
    SMTP_PORT: getNumber('SMTP_PORT', 587),
    SMTP_USER: get('SMTP_USER'),
    SMTP_PASS: get('SMTP_PASS'),
    MAIL_FROM: get('MAIL_FROM'),

    // Google OAuth (có thể để trống nếu chưa dùng)
    GOOGLE_CLIENT_ID: get('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: get('GOOGLE_CLIENT_SECRET'),
    GOOGLE_CALLBACK_URL: get('GOOGLE_CALLBACK_URL'),

    // tiện dùng
    IS_PROD: get('NODE_ENV') === 'production',
};

// Cảnh báo mềm khi thiếu SMTP (dev vẫn chạy, chỉ không gửi mail)
if (!config.SMTP_USER || !config.SMTP_PASS) {
    console.warn('[env] SMTP_USER/SMTP_PASS chưa thiết lập — gửi OTP email sẽ thất bại trong môi trường thật.');
}

module.exports = config;
