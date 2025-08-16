const session = require('express-session');
const { RedisStore } = require('connect-redis'); // 👈 khác ở đây
const redis = require('./redis');
const { SESSION_SECRET, NODE_ENV } = require('./env');

const isProd = NODE_ENV === 'production';

// Tạo store
const store = new RedisStore({ client: redis });

const sessionMiddleware = session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd, // true nếu chạy HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    }
});

module.exports = sessionMiddleware;
