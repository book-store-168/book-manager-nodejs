// // src/config/redis.js
// const { createClient } = require('redis');
// const env = require('./env'); // 👈 import env thay vì dotenv
//
// const client = createClient({ url: env.REDIS_URL });
//
// client.on('error', (err) => {
//     console.error('[Redis] Error:', err);
// });
//
// // Connect ngay khi khởi tạo
// (async () => {
//     if (!client.isOpen) {
//         await client.connect();
//         console.log('[Redis] Connected to', env.REDIS_URL);
//     }
// })();
//
// module.exports = client;
// src/config/redis.js
const { createClient } = require('redis');
require('dotenv').config();

const url =
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const client = createClient({ url });
client.on('error', (err) => console.error('Redis error:', err));

(async () => {
    if (!client.isOpen) await client.connect();
})();

module.exports = client;
