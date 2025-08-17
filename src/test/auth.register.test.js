// src/test/auth.register.test.js

// 👇 Mock PHẢI đứng trước khi require('../app')
jest.mock('../config/redis',  () => require('./__mocks__/redis.mock'));
jest.mock('../config/db',     () => require('./__mocks__/db.mock'));
jest.mock('../services/mail.service', () => ({
    sendOTP: jest.fn(async () => ({ messageId: 'mocked' })),
}));

const request = require('supertest');
const app = require('../app');

const db = require('./__mocks__/db.mock');
const redis = require('./__mocks__/redis.mock');
const { sendOTP } = require('../services/mail.service');
const bcrypt = require('bcrypt');

// giảm thời gian hash xuống gần như 0
jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pw');

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        db.__reset();
        jest.clearAllMocks();
    });

    it('registers a new user and sends OTP', async () => {
        const payload = { email: 'user1@example.com', password: 'P@ssw0rd!', name: 'User One' };

        const res = await request(app).post('/api/auth/register').send(payload);

        expect([200,201]).toContain(res.status);
        expect(res.body).toHaveProperty('userId');
        expect(res.body).toHaveProperty('message');

        // Đảm bảo đã lưu OTP và gửi email (mock được gọi)
        expect(redis.set).toHaveBeenCalled();      // save OTP
        expect(sendOTP).toHaveBeenCalled();        // send mail
    });

    it('rejects duplicate email', async () => {
        const payload = { email: 'dup@example.com', password: 'P@ssw0rd!', name: 'Dup' };

        await request(app).post('/api/auth/register').send(payload); // lần 1 ok
        const res = await request(app).post('/api/auth/register').send(payload); // lần 2

        expect([400,409]).toContain(res.status);
    });
});

// Giúp Jest thoát sạch
afterAll(() => {
    jest.resetModules();
});
