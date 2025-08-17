document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('f');
    const out  = document.getElementById('out');
    const emailEl = document.getElementById('email');
    const passEl  = document.getElementById('password');
    const btnGoogle = document.getElementById('btnGoogle');

    // prefill email nếu có
    const last = localStorage.getItem('last_email') || '';
    if (last) emailEl.value = last;

    // Đăng nhập user/pass như cũ
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailEl.value.trim();
        const password = passEl.value;

        out.style.color = '#000';
        out.textContent = 'Đang đăng nhập...';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);

            localStorage.setItem('last_email', email);
            out.style.color = 'green';
            out.textContent = data.message || 'Đăng nhập thành công.';
            setTimeout(() => location.href = '/profile.html', 600);
        } catch (err) {
            out.style.color = 'red';
            out.textContent = 'Lỗi: ' + err.message;
            console.error('[LOGIN]', err);
        }
    });

    // 👉 Đăng nhập bằng Google: điều hướng tới endpoint OAuth trên backend
    btnGoogle.addEventListener('click', () => {
        // Sau khi Google callback xong, backend nên redirect về /profile.html
        const redirectAfter = encodeURIComponent('/profile.html');
        // Tùy backend: đổi /api/auth/google nếu bạn dùng route khác (vd: /auth/google)
        window.location.href = `/api/auth/google?redirect=${redirectAfter}`;
    });
});
