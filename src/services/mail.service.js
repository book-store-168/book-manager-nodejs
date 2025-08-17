// src/config/mailer.js
const nodemailer = require('nodemailer');
const env = require('../config/env'); // import từ config/env

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // false với port 587
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

async function sendOTP(email, code) {
    const info = await transporter.sendMail({
        from: env.MAIL_FROM,
        to: email,
        subject: 'Xác thực tài khoản - Mã OTP',
        html: `
      <p>Xin chào,</p>
      <p>Mã xác thực (OTP) của bạn là: <b style="font-size:16px">${code}</b></p>
      <p>Mã có hiệu lực trong ${env.OTP_TTL_SECONDS} giây.</p>
      <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
    `,
    });
    return info;
}

module.exports = { sendOTP };
