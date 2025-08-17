// src/config/env.js
const path = require('path');
const dotenv = require('dotenv');

// Load .env duy nhất 1 lần
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Helper bắt buộc có biến
function requireEnv(name) {
    const v = process.env[name];
    if (v === undefined || v === null || v === '') {
        throw new Error(`Missing required env: ${name}`);
    }
    return v;
}

const toBool = (v, def = false) => {
    if (v === undefined) return def;
    return ['1', 'true', 'yes', 'y', 'on'].includes(String(v).toLowerCase());
};

const toInt = (v, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};

module.exports = {
    // App
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: toInt(process.env.PORT, 3000),
    HOST: process.env.HOST || '0.0.0.0',
    SESSION_SECRET: requireEnv('SESSION_SECRET'),

    // MySQL
    DB_HOST: requireEnv('DB_HOST'),
    DB_PORT: toInt(process.env.DB_PORT, 3306),
    DB_USER: requireEnv('DB_USER'),
    DB_PASSWORD: requireEnv('DB_PASS'), // map từ DB_PASS trong .env
    DB_NAME: requireEnv('DB_NAME'),

    // Redis
    REDIS_URL:
        process.env.REDIS_URL ||
        `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`,

    // SMTP (mail gửi OTP)
    SMTP_HOST: requireEnv('SMTP_HOST'),
    SMTP_PORT: toInt(process.env.SMTP_PORT, 587),
    SMTP_SECURE: toBool(process.env.SMTP_SECURE, false), // mặc định false nếu không khai báo
    SMTP_USER: requireEnv('SMTP_USER'),
    SMTP_PASS: requireEnv('SMTP_PASS'),
    MAIL_FROM: requireEnv('MAIL_FROM'),

    // Google OAuth
    GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
    GOOGLE_CALLBACK_URL: requireEnv('GOOGLE_CALLBACK_URL'),

    // OTP
    OTP_TTL_SECONDS: toInt(process.env.OTP_TTL_SECONDS, 300),
    OTP_LENGTH: toInt(process.env.OTP_LENGTH, 6),
    OTP_RESEND_COOLDOWN: toInt(process.env.OTP_RESEND_COOLDOWN, 60),
};
