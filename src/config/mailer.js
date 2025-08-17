// src/config/mailer.js
// Ở môi trường thật bạn có thể cấu hình Nodemailer transporter tại đây.
// Nhưng khi test thì Jest sẽ mock bằng __mocks__/mailer.mock.js.

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
    }
});

module.exports = transporter;
