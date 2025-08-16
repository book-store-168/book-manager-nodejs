const redis = require('../config/redis');
require('dotenv').config();

const OTP_TTL = Number(process.env.OTP_TTL_SECONDS || 300);
const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const RESEND_COOLDOWN = Number(process.env.OTP_RESEND_COOLDOWN || 60);

function randomOTP(length = 6) {
    // tạo chuỗi số, đảm bảo độ dài cố định
    let s = '';
    for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
    return s;
}

function otpKey(email) {
    return `otp:${email}`;
}
function throttleKey(email) {
    return `otp_throttle:${email}`;
}

async function canResend(email) {
    const key = throttleKey(email);
    const ttl = await redis.ttl(key);
    return ttl <= 0; // hết cooldown
}

async function setThrottle(email) {
    const key = throttleKey(email);
    await redis.set(key, '1', { EX: RESEND_COOLDOWN });
}

async function createAndSaveOTP(email) {
    const code = randomOTP(OTP_LENGTH);
    await redis.set(otpKey(email), code, { EX: OTP_TTL });
    return code;
}

async function getOTP(email) {
    return redis.get(otpKey(email));
}

async function deleteOTP(email) {
    return redis.del(otpKey(email));
}

module.exports = {
    createAndSaveOTP,
    getOTP,
    deleteOTP,
    canResend,
    setThrottle
};
