// src/config/redis.js
const { createClient } = require('redis');
const env = require('./env'); // 👈 import env thay vì dotenv

const client = createClient({ url: env.REDIS_URL });

client.on('error', (err) => {
    console.error('[Redis] Error:', err);
});

// Connect ngay khi khởi tạo
(async () => {
    if (!client.isOpen) {
        await client.connect();
        console.log('[Redis] Connected to', env.REDIS_URL);
    }
})();

module.exports = client;
