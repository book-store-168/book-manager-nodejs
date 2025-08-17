module.exports = {
    sendOTP: jest.fn(async (email, code) => {
        console.log(`[Mock Mailer] Sent OTP ${code} to ${email}`);
        return true;
    })
};
