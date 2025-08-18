// src/app.js
const env = require('./config/env'); // luôn load .env đầu tiên
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./config/session');
const passport = require('./passport/passport');

const app = express();

/* ========== Security & Basics ========== */
app.use(helmet());                          // headers bảo mật
app.use(morgan('dev'));                     // logger
app.use(express.json());                    // body JSON
app.use(express.urlencoded({ extended: true })); // body form
app.use(cookieParser());

// Nếu deploy sau proxy (Nginx/Render/Heroku) và dùng cookie-secure:
// app.set('trust proxy', 1);

/* ========== CORS (nếu FE khác origin) ========== */
// Ưu tiên lấy từ ENV, fallback true cho dev
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; // ví dụ http://localhost:3000
app.use(
    cors({
        origin: CLIENT_ORIGIN ? [CLIENT_ORIGIN] : true,
        credentials: true,
    })
);

/* ========== Session -> Passport (thứ tự QUAN TRỌNG) ========== */
app.use(sessionMiddleware);   // phải đứng trước passport.session()
app.use(passport.initialize());
app.use(passport.session());  // bật session cho Passport

/* ========== Static Frontend ========== */
const staticDir = path.resolve(__dirname, '../public');
console.log('[STATIC] Serving from:', staticDir);
app.use(express.static(staticDir));

/* ========== API Routes (đặt SAU session/passport) ========== */
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Nếu bạn đã tạo routes dành cho user (profile…):
// Khuyên dùng file tách riêng: ./routes/user.routes
// Hoặc nếu bạn muốn gom qua ./routes/index thì vẫn OK
const userRoutes = require('./routes/index'); // hoặc './routes/index'
app.use('/api/users', userRoutes);

/* ========== Health check ========== */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ========== SPA fallback (tùy bạn) ========== */
// Nếu FE là static single page, mở comment bên dưới để mọi route khác trả index.html
// app.get('*', (req, res, next) => {
//   if (req.path.startsWith('/api/')) return next();
//   res.sendFile(path.join(staticDir, 'index.html'));
// });

/* ========== 404 cho API ========== */
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not Found' }));

/* ========== Error handler cuối cùng ========== */
app.use((err, _req, res, _next) => {
    console.error(err);
    const code = err.status || 500;
    res.status(code).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
