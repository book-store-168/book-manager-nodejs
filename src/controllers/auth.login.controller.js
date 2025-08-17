// src/controllers/auth.login.controller.js
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const env = require('../config/env');

// ------------- Validators -------------
exports.validateLogin = [
    body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 1 }).withMessage('Vui lòng nhập mật khẩu'),
    body('rememberEmail')
        .optional()
        .isBoolean().withMessage('rememberEmail phải là boolean')
        .toBoolean(), // <- chuyển "true"/"false" -> boolean
];

// ------------- POST /api/auth/login -------------
exports.login = async (req, res) => {
    try {
        // 1) validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });
        }

        const emailRaw = req.body.email;
        const { password, rememberEmail } = req.body;
        const email = String(emailRaw).trim().toLowerCase();

        // 2) tìm user theo email
        const [rows] = await pool.execute(
            `SELECT id, email, password, name, role, status, deleted
       FROM users
       WHERE email = ? LIMIT 1`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const user = rows[0];

        if (user.deleted) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa/xóa' });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Tài khoản chưa kích hoạt. Vui lòng xác thực OTP.' });
        }

        // 3) so khớp mật khẩu (user.password có thể NULL nếu đăng ký qua Google)
        const ok = await bcrypt.compare(password, user.password || '');
        if (!ok) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        // 4) Tạo session an toàn (ngừa session fixation)
        req.session.regenerate((err) => {
            if (err) return res.status(500).json({ message: 'Không tạo được phiên' });

            // chỉ lưu thông tin cần thiết (không bao giờ lưu hash)
            req.session.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            };

            // 5) Ghi nhớ email để autofill lần sau (cookie riêng, KHÔNG liên quan session)
            if (rememberEmail) {
                res.cookie('remember_email', email, {
                    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 ngày
                    httpOnly: false,                  // để frontend đọc được
                    sameSite: 'lax',
                    secure: env.NODE_ENV === 'production', // bật khi HTTPS
                    path: '/',                         // đảm bảo clearCookie dùng cùng path
                    // domain: 'localhost',            // thêm nếu bạn dùng domain riêng
                });
            } else {
                res.clearCookie('remember_email', { path: '/' });
            }

            // 6) đảm bảo flush cookie phiên xuống client
            req.session.save((err2) => {
                if (err2) return res.status(500).json({ message: 'Không lưu được phiên' });
                return res.json({
                    message: 'Đăng nhập thành công',
                    user: req.session.user
                });
            });
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// ------------- POST /api/auth/logout -------------
exports.logout = async (req, res) => {
    const SID_COOKIE = 'connect.sid';
    try {
        if (!req.session) {
            res.clearCookie(SID_COOKIE, { path: '/' });
            return res.json({ message: 'Đăng xuất thành công' });
        }
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ message: 'Không thể logout ngay lúc này' });
            res.clearCookie(SID_COOKIE, { path: '/' });
            return res.json({ message: 'Đăng xuất thành công' });
        });
    } catch (e) {
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// ------------- GET /api/auth/me -------------
exports.me = async (req, res) => {
    const currentUser = req.session?.user || req.user || null; // hỗ trợ cả Passport
    if (!currentUser) return res.status(401).json({ message: 'Chưa đăng nhập' });
    return res.json({ user: currentUser });
};

// ------------- GET /api/auth/remember-email -------------
exports.getRememberEmail = async (req, res) => {
    const value = req.cookies?.remember_email || '';
    return res.json({ remember_email: value });
};
