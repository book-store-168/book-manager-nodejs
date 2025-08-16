// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const passport = require('../passport/passport'); // dùng cùng module với app.js

const registerCtrl = require('../controllers/auth.controller');
const loginCtrl = require('../controllers/auth.login.controller');
const { ensureAuth } = require('../middlewares/auth.middleware');

// -------------------- Đăng ký + OTP --------------------
router.post('/register', registerCtrl.validateRegister, asyncHandler(registerCtrl.register));
router.post('/verify-otp', registerCtrl.validateVerifyOtp, asyncHandler(registerCtrl.verifyOtp));
router.post('/resend-otp', registerCtrl.validateResendOtp, asyncHandler(registerCtrl.resendOtp));

// -------------------- Email/Password login --------------------
router.post('/login', loginCtrl.validateLogin, asyncHandler(loginCtrl.login));
router.post('/logout', asyncHandler(loginCtrl.logout));
router.get('/me', ensureAuth, asyncHandler(loginCtrl.me));
router.get('/remember-email', asyncHandler(loginCtrl.getRememberEmail)); // tiện autofill form

/* ==================== GOOGLE LOGIN ==================== */
// B1: redirect qua Google consent
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// B2: callback từ Google
// Lưu ý: phương án B (chặt chẽ) được thực thi trong strategy (passport):
// - Nếu user INACTIVE (chưa OTP) => done(null, false, { code:'NEED_OTP', ... }) => rơi vào failure
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/api/auth/google/fail',
        session: true, // dùng session cho Passport
    }),
    (req, res) => {
        // Đồng bộ session với login thường để /me luôn đọc thống nhất
        req.session.user = {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
        };

        // Ghi nhớ email để autofill form (không xóa khi logout)
        res.cookie('remember_email', req.user.email, {
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 ngày
            httpOnly: false, // để FE đọc được
            sameSite: 'lax',
            secure: false, // bật true nếu HTTPS
        });

        // Đảm bảo Set-Cookie được flush xong rồi mới chuyển
        req.session.save(() => res.redirect('/api/auth/google/success'));
    }
);

// (Tùy chọn) Success endpoint: trả JSON user
router.get('/google/success', (req, res) => {
    const user = req.session?.user || req.user;
    if (!user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    return res.json({ message: 'Google login thành công', user });
});

// Failure endpoint: INACTIVE, bị chặn… sẽ rơi vào đây
router.get('/google/fail', (_req, res) => {
    return res.status(403).json({
        message: 'Không thể đăng nhập bằng Google. Tài khoản có thể chưa kích hoạt OTP hoặc có lỗi khác.',
        code: 'GOOGLE_LOGIN_FAILED',
    });
});

module.exports = router;
