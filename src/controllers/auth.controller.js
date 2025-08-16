const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendOTP } = require('../services/mail.service');
const {
    createAndSaveOTP,
    getOTP,
    deleteOTP,
    canResend,
    setThrottle
} = require('../services/otp.service');

const SALT_ROUNDS = 12;

exports.validateRegister = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('name').trim().notEmpty().withMessage('Tên không được để trống'),
    body('password')
        .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
        .matches(/[A-Z]/).withMessage('Mật khẩu cần ít nhất 1 chữ hoa')
        .matches(/[a-z]/).withMessage('Mật khẩu cần ít nhất 1 chữ thường')
        .matches(/[0-9]/).withMessage('Mật khẩu cần ít nhất 1 số'),
];

exports.register = async (req, res) => {
    // 1) validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });
    }

    const { email, name, password } = req.body;

    // 2) kiểm tra email tồn tại
    const [rows] = await pool.execute(
        'SELECT id, status FROM users WHERE email = :email LIMIT 1',
        { email }
    );
    if (rows.length > 0) {
        return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    // 3) hash password
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4) lưu user INACTIVE
    const [result] = await pool.execute(
        `INSERT INTO users (email, password, name, role, status, deleted)
     VALUES (:email, :password, :name, 'USER', 'INACTIVE', FALSE)`,
        { email, password: hash, name }
    );

    // 5) tạo OTP + lưu Redis + gửi email
    const code = await createAndSaveOTP(email);
    await sendOTP(email, code);
    await setThrottle(email); // đặt cooldown gửi lại OTP

    return res.status(201).json({
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhận OTP kích hoạt.',
        userId: result.insertId
    });
};

// Xác thực OTP
exports.validateVerifyOtp = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('otp').isLength({ min: 4 }).withMessage('OTP không hợp lệ'),
];

exports.verifyOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });

    const { email, otp } = req.body;

    // 1) lấy OTP trong Redis
    const savedOtp = await getOTP(email);
    if (!savedOtp) {
        return res.status(400).json({ message: 'OTP không tồn tại hoặc đã hết hạn' });
    }

    // 2) so sánh
    if (savedOtp !== otp) {
        return res.status(400).json({ message: 'OTP không chính xác' });
    }

    // 3) cập nhật ACTIVE
    const [result] = await pool.execute(
        `UPDATE users SET status='ACTIVE' WHERE email = :email AND deleted = FALSE`,
        { email }
    );
    await deleteOTP(email);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc đã bị xóa' });
    }

    return res.json({ message: 'Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.' });
};

// Gửi lại OTP (resend)
exports.validateResendOtp = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
];

exports.resendOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });

    const { email } = req.body;

    // chỉ cho phép resend nếu user tồn tại & INACTIVE
    const [rows] = await pool.execute(
        'SELECT id, status FROM users WHERE email = :email LIMIT 1',
        { email }
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Email chưa đăng ký' });
    if (rows[0].status === 'ACTIVE') return res.status(400).json({ message: 'Tài khoản đã được kích hoạt' });

    // cooldown
    if (!(await canResend(email))) {
        return res.status(429).json({ message: 'Vui lòng đợi trước khi gửi lại OTP' });
    }

    const code = await createAndSaveOTP(email);
    await sendOTP(email, code);
    await setThrottle(email);

    return res.json({ message: 'Đã gửi lại OTP. Vui lòng kiểm tra email.' });
};
