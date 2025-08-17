// Mock PHẢI đứng trước khi require app
jest.mock('../config/redis', () => require('./__mocks__/redis.mock'));
jest.mock('../config/db',    () => require('./__mocks__/db.mock'));
// (verify OTP không gửi mail, nên không cần mock mailer)

const request = require('supertest');
const app = require('../app');
const db = require('./__mocks__/db.mock');
const redis = require('./__mocks__/redis.mock');

describe('POST /api/auth/verify-otp', () => {
    beforeEach(() => { db.__reset(); redis.__reset(); jest.clearAllMocks(); });

    it('kích hoạt thành công khi OTP đúng', async () => {
        const email = 'otp@example.com';
        const otp = '123456';

        // seed user PENDING
        db.__seed.addUser({ email, status: 'PENDING' });

        // otp.service dùng key "otp:<email>"
        await redis.set(`otp:${email}`, otp);

        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email, otp });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Kích hoạt tài khoản thành công/i);

        // OTP đã bị xóa
        const left = await redis.get(`otp:${email}`);
        expect(left).toBeNull();

        // user đã ACTIVE
        const users = db.__seed.getUsers();
        expect(users[0].status).toBe('ACTIVE');
    });

    it('báo lỗi khi OTP sai', async () => {
        const email = 'wrong@example.com';
        db.__seed.addUser({ email, status: 'PENDING' });

        await redis.set(`otp:${email}`, '222222'); // khác với otp client gửi

        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email, otp: '111111' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/OTP không chính xác/i);
    });
});
