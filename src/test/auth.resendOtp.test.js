// Mock PHẢI đứng trước khi require('../app')
jest.mock('../config/redis', () => require('./__mocks__/redis.mock'));
jest.mock('../config/db',    () => require('./__mocks__/db.mock'));
jest.mock('../services/mail.service', () => ({
    sendOTP: jest.fn(async () => ({ messageId: 'mocked' })),
}));

const request = require('supertest');
const app = require('../app');
const db = require('./__mocks__/db.mock');
const redis = require('./__mocks__/redis.mock');
const { sendOTP } = require('../services/mail.service');

const otpKey = (email) => `otp:${email}`;
const throttleKey = (email) => `otp_throttle:${email}`;

describe('POST /api/auth/resend-otp', () => {
    beforeEach(() => {
        db.__reset();
        redis.__reset();
        jest.clearAllMocks();
    });

    it('gửi lại OTP thành công khi user PENDING và không cooldown', async () => {
        const email = 'pending@example.com';
        // user đang PENDING
        db.__seed.addUser({ email, status: 'PENDING' });

        const res = await request(app)
            .post('/api/auth/resend-otp')
            .send({ email });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Đã gửi lại OTP/i);

        // Đã tạo OTP (set otp:<email>) và set throttle (otp_throttle:<email>)
        // redis.set được gọi ít nhất 2 lần — ta kiểm tra có key mong muốn
        const setCalls = redis.set.mock.calls.map(args => args[0]);
        expect(setCalls).toEqual(expect.arrayContaining([otpKey(email), throttleKey(email)]));

        // Gửi mail được gọi
        expect(sendOTP).toHaveBeenCalledWith(email, expect.any(String));
    });

    it('chặn resend khi đang cooldown', async () => {
        const email = 'cooldown@example.com';
        db.__seed.addUser({ email, status: 'PENDING' });

        // Đặt trước throttle key để canResend trả false (ttl>0)
        await redis.set(throttleKey(email), '1');

        const res = await request(app)
            .post('/api/auth/resend-otp')
            .send({ email });

        expect(res.status).toBe(429);
        expect(res.body.message).toMatch(/Vui lòng đợi/i);

        // Không gửi mail, không tạo OTP mới
        expect(sendOTP).not.toHaveBeenCalled();
        const setCalls = redis.set.mock.calls.map(args => args[0]);
        expect(setCalls).not.toContain(otpKey(email));
    });

    it('404 khi email chưa đăng ký', async () => {
        const res = await request(app)
            .post('/api/auth/resend-otp')
            .send({ email: 'notfound@example.com' });

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/chưa đăng ký/i);
        expect(sendOTP).not.toHaveBeenCalled();
    });

    it('400 khi tài khoản đã ACTIVE', async () => {
        const email = 'active@example.com';
        db.__seed.addUser({ email, status: 'ACTIVE' });

        const res = await request(app)
            .post('/api/auth/resend-otp')
            .send({ email });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/đã được kích hoạt/i);
        expect(sendOTP).not.toHaveBeenCalled();
    });
});
