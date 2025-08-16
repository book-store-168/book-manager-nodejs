const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendOTP(email, code) {
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'Xác thực tài khoản - Mã OTP',
        html: `
      <p>Xin chào,</p>
      <p>Mã xác thực (OTP) của bạn là: <b style="font-size:16px">${code}</b></p>
      <p>Mã có hiệu lực trong ${process.env.OTP_TTL_SECONDS || 300} giây.</p>
      <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
    `
    });
    return info;
}

module.exports = { sendOTP };
