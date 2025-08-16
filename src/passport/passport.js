// src/passport/passport.js
const passport = require('passport'); // dùng singleton
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/db');

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
} = process.env;

passport.use(new GoogleStrategy(
    {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
    },
    async (_at, _rt, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const name  = profile.displayName || profile.name?.givenName || 'User';
            const gid   = profile.id;

            if (!email) {
                return done(null, false, { code: 'NO_EMAIL', message: 'Không lấy được email từ Google' });
            }

            // 1) Ưu tiên tra theo google_id (đã liên kết trước đó)
            const [byGid] = await pool.execute(
                'SELECT id, email, name, role, status, deleted FROM users WHERE google_id = ? LIMIT 1',
                [gid]
            );
            if (byGid.length) {
                const u = byGid[0];
                if (u.deleted) return done(null, false, { code: 'DELETED', message: 'Tài khoản đã bị khóa/xóa' });
                if (u.status !== 'ACTIVE') {
                    return done(null, false, { code: 'NEED_OTP', message: 'Tài khoản chưa kích hoạt. Vui lòng xác thực OTP.', email: u.email });
                }
                return done(null, { id: u.id, email: u.email, name: u.name, role: u.role });
            }

            // 2) Chưa có theo gid → tra theo email
            const [byEmail] = await pool.execute(
                'SELECT id, email, name, role, status, deleted, google_id FROM users WHERE email = ? LIMIT 1',
                [email]
            );

            if (byEmail.length) {
                const u = byEmail[0];
                if (u.deleted) return done(null, false, { code: 'DELETED', message: 'Tài khoản đã bị khóa/xóa' });

                // 🚫 CHẶT CHẼ: bắt buộc ACTIVE trước khi cho Google login/liên kết
                if (u.status !== 'ACTIVE') {
                    return done(null, false, { code: 'NEED_OTP', message: 'Tài khoản chưa kích hoạt. Vui lòng xác thực OTP trước.', email });
                }

                // Đã ACTIVE:
                // nếu email đã có google_id khác → chặn (tránh chiếm đoạt)
                if (u.google_id && u.google_id !== gid) {
                    return done(null, false, { code: 'CONFLICT_GOOGLE', message: 'Email này đã liên kết với tài khoản Google khác.' });
                }

                // Nếu chưa có google_id → LIÊN KẾT NGAY (vì ACTIVE)
                if (!u.google_id) {
                    await pool.execute('UPDATE users SET google_id = ? WHERE id = ?', [gid, u.id]);
                }

                return done(null, { id: u.id, email: u.email, name: u.name, role: u.role });
            }

            // 3) Email chưa tồn tại → cho phép tạo user mới từ Google (ACTIVE luôn)
            const [ins] = await pool.execute(
                `INSERT INTO users (email, password, name, role, google_id, status, deleted)
         VALUES (?, NULL, ?, 'USER', ?, 'ACTIVE', FALSE)`,
                [email, name, gid]
            );
            return done(null, { id: ins.insertId, email, name, role: 'USER' });

        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;
