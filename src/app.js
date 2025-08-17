const env = require('./config/env'); // <— import đầu tiên để chắc chắn .env đã load
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./config/session');
const passport = require('./passport/passport');
const path = require('path');

const app = express();

// 🔒 Security & middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// 🗄️ Session trước
app.use(sessionMiddleware);

// 🛂 Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Serve static frontend
const staticDir = path.resolve(__dirname, '../public');
console.log('[STATIC] Serving from:', staticDir);
app.use(express.static(staticDir));

// 👉 Route mặc định trả index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// 🔌 API Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// 🩺 Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// ❌ Error handler cuối cùng
app.use((err, req, res, next) => {
    console.error(err);
    const code = err.status || 500;
    res.status(code).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
