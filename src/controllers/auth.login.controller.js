const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// ------------- Validators -------------
exports.validateLogin = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 1 }).withMessage('Vui lòng nhập mật khẩu'),
    body('rememberEmail').optional().isBoolean().withMessage('rememberEmail phải là boolean'),
];

// ------------- POST /api/auth/login -------------
exports.login = async (req, res) => {
    // 1) validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });
    }

    const { email, password, rememberEmail } = req.body;

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

    // 3) so khớp mật khẩu
    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // 4) Tạo session an toàn (ngừa session fixation) + đảm bảo Set-Cookie được gửi đi
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
                secure: false                     // bật true khi chạy HTTPS thật
            });
        } else {
            res.clearCookie('remember_email', { path: '/' });
        }

        // đảm bảo flush cookie phiên xuống client
        req.session.save((err2) => {
            if (err2) return res.status(500).json({ message: 'Không lưu được phiên' });
            return res.json({
                message: 'Đăng nhập thành công',
                user: req.session.user
            });
        });
    });
};

// ------------- POST /api/auth/logout -------------
exports.logout = async (req, res) => {
    const SID_COOKIE = 'connect.sid';

    if (!req.session) {
        // không có session vẫn xoá cookie phiên cho chắc
        res.clearCookie(SID_COOKIE, { path: '/' });
        return res.json({ message: 'Đăng xuất thành công' });
    }

    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Không thể logout ngay lúc này' });
        // Xoá cookie phiên phía client (path phải trùng với lúc set)
        res.clearCookie(SID_COOKIE, { path: '/' });
        return res.json({ message: 'Đăng xuất thành công' });
    });
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
