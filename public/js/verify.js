document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('f');
    const out  = document.getElementById('out');
    const emailEl = document.getElementById('email');
    const otpEl   = document.getElementById('otp');
    const btnResend = document.getElementById('btnResend');
    const cdLbl = document.getElementById('cd');

    // prefill email từ query ?email= hoặc localStorage
    const p = new URLSearchParams(location.search);
    const last = localStorage.getItem('last_email') || '';
    const qmail = p.get('email') || last;
    if (qmail) emailEl.value = qmail;

    // cooldown resend (UI client-side)
    const CD_KEY = 'resend_otp_next';
    function remain() {
        const ts = parseInt(localStorage.getItem(CD_KEY) || '0', 10);
        const r = Math.max(0, Math.floor((ts - Date.now())/1000));
        return isNaN(r) ? 0 : r;
    }
    function paintCooldown() {
        const r = remain();
        if (r <= 0) { btnResend.disabled = false; cdLbl.textContent = ''; return; }
        btnResend.disabled = true; cdLbl.textContent = `(còn ${r}s)`;
    }
    setInterval(paintCooldown, 1000); paintCooldown();

    // submit verify
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailEl.value.trim();
        const otp = otpEl.value.trim();

        out.style.color = '#000';
        out.textContent = 'Đang xác thực...';
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);

            localStorage.setItem('last_email', email);
            out.style.color = 'green';
            out.textContent = data.message || 'Xác thực thành công.';
            setTimeout(() => location.href = '/login.html', 800);
        } catch (err) {
            out.style.color = 'red';
            out.textContent = 'Lỗi: ' + err.message;
            console.error('[VERIFY]', err);
        }
    });

    // resend
    btnResend.addEventListener('click', async () => {
        const email = emailEl.value.trim();
        if (!email) { out.style.color='red'; out.textContent='Nhập email trước khi gửi lại OTP'; return; }

        out.style.color = '#000';
        out.textContent = 'Đang gửi lại OTP...';
        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);

            localStorage.setItem('last_email', email);
            // đặt cooldown 60s (điều chỉnh cho khớp backend nếu khác)
            const next = Date.now() + 60*1000;
            localStorage.setItem(CD_KEY, String(next));
            paintCooldown();

            out.style.color = 'green';
            out.textContent = data.message || 'Đã gửi lại OTP. Kiểm tra email.';
        } catch (err) {
            out.style.color = 'red';
            out.textContent = 'Lỗi: ' + err.message;
            console.error('[RESEND]', err);
        }
    });
});
