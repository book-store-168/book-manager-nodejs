document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('regForm');
    const out  = document.getElementById('out');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const name  = document.getElementById('name').value.trim();
        const password = document.getElementById('password').value;

        out.style.color = '#000';
        out.textContent = 'Đang gửi...';

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // để cookie session hoạt động
                body: JSON.stringify({ email, name, password })
            });

            let data = null;
            try { data = await res.json(); } catch (_) { data = {}; }

            if (!res.ok) {
                const msg = (data && (data.message || data.error)) || ('HTTP ' + res.status);
                throw new Error(msg);
            }

            out.style.color = 'green';
            out.textContent = data.message || 'Đăng ký thành công. Vui lòng kiểm tra email để lấy OTP.';
            setTimeout(() => {
                location.href = '/verify.html?email=' + encodeURIComponent(email);
            }, 800);
        } catch (err) {
            out.style.color = 'red';
            out.textContent = 'Lỗi: ' + err.message;
            console.error('[REGISTER] error:', err);
        }
    });
});
