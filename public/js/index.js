document.addEventListener('DOMContentLoaded', async () => {
    const out = document.getElementById('out');
    const nav = document.getElementById('nav');
    out.textContent = 'Đang kiểm tra phiên đăng nhập...';

    function extractUser(payload) {
        if (!payload || typeof payload !== 'object') return null;
        if (payload.user) return payload.user;
        if (payload.data && payload.data.user) return payload.data.user;
        if (payload.data) return payload.data;
        return payload;
    }

    async function getMe() {
        const paths = ['/api/users/me', '/api/auth/me'];
        for (const p of paths) {
            try {
                const r = await fetch(p, { credentials: 'include' });
                const data = await r.json().catch(() => ({}));
                if (!r.ok) continue;
                const user = extractUser(data);
                if (user) return user;
            } catch {}
        }
        throw new Error();
    }

    async function updateUI() {
        try {
            const me = await getMe();
            out.style.color = 'green';
            out.textContent = 'Đã đăng nhập: ' + (me.email || 'unknown');
            nav.innerHTML = `
                <a href="/profile.html">Profile</a> |
                <a href="#" id="btnLogout">Đăng xuất</a>
            `;
        } catch {
            out.style.color = '#333';
            out.textContent = 'Chưa đăng nhập.';
            nav.innerHTML = `
                <a href="/register.html">Register</a> |
                <a href="/login.html">Login</a>
            `;
        }
    }

    await updateUI();
});