const session = require('express-session');
const redis = require('./redis');
const { SESSION_SECRET, NODE_ENV } = require('./env');

// 👇 sửa chỗ này
const { RedisStore } = require('connect-redis');

const isProd = NODE_ENV === 'production';

// Tạo store
const store = new RedisStore({ client: redis });

module.exports = session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    }
});

