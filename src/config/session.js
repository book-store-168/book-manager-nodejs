const session = require('express-session');

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    // cookie mặc định là session cookie (hết khi đóng trình duyệt).
    // Khi "remember me" = true, ta sẽ set maxAge lúc đăng nhập.
    cookie: {
        httpOnly: true,
        secure: false, // để true nếu chạy HTTPS/proxy đúng chuẩn
        sameSite: 'lax',
    },
});

module.exports = sessionMiddleware;
