// src/config/session.js
const session = require('express-session');
const env = require('./env');
const redisClient = require('./redis');

let connectRedis;
try {
    connectRedis = require('connect-redis');
} catch (e) {
    throw new Error(
        'connect-redis chưa được cài. Chạy: npm i connect-redis'
    );
}

let RedisStore;
if (typeof connectRedis === 'function') {
    // v3–v6: module export là function(session) -> class RedisStore
    RedisStore = connectRedis(session);
} else if (connectRedis && (connectRedis.default || connectRedis.RedisStore)) {
    // v7+: ESM default export / hoặc named export RedisStore
    RedisStore = connectRedis.default || connectRedis.RedisStore;
} else {
    throw new Error(
        `Unsupported connect-redis export shape: ${typeof connectRedis}. 
Hãy khóa phiên bản: npm i connect-redis@7 redis@^4 express-session@^1`
    );
}

module.exports = session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        client: redisClient,
        prefix: 'sess:', // có thể đổi
    }),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
    },
});
