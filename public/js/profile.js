document.addEventListener('DOMContentLoaded', () => {
    const out = document.getElementById('out');
    const btnLogout = document.getElementById('btnLogout');

    // Chuẩn hoá payload từ API về object "user"
    function extractUser(payload) {
        if (!payload || typeof payload !== 'object') return null;
        if (payload.user && typeof payload.user === 'object') return payload.user;
        if (payload.data && typeof payload.data === 'object') {
            if (payload.data.user && typeof payload.data.user === 'object') return payload.data.user;
            return payload.data; // data chính là user
        }
        return payload; // trả phẳng ở root
    }

    // Map status số -> chữ (nếu backend trả 0/1)
    function fmtStatus(val) {
        if (val === 0 || val === '0') return 'INACTIVE';
        if (val === 1 || val === '1') return 'ACTIVE';
        return String(val || '-');
    }

    async function getMe() {
        const paths = ['/api/users/me', '/api/auth/me', '/api/me'];
        for (const p of paths) {
            try {
                const r = await fetch(p, { credentials: 'include' });
                const data = await r.json().catch(() => ({}));
                if (!r.ok) continue;
                const user = extractUser(data);
                if (user) return user;
            } catch (_) { /* thử path tiếp theo */ }
        }
        throw new Error('Không lấy được thông tin người dùng');
    }

    (async () => {
        out.textContent = 'Đang tải hồ sơ...';
        try {
            const me = await getMe();

            const text = [
                'Email: ' + (me.email ?? '-'),
                'Họ tên: ' + (me.name ?? '-'),
                'Role: ' + (me.role ?? '-'),
                'Trạng thái: ' + fmtStatus(me.status),
                'Phone: ' + (me.phone ?? me?.profile?.phone ?? '-'),
                'Địa chỉ: ' + (me.address ?? me?.profile?.address ?? '-')
            ].join('\n');

            out.style.color = '#000';
            out.textContent = text;

            // Debug (nếu cần xem JSON thô): mở comment dưới
            // out.textContent += '\n\nRAW:\n' + JSON.stringify(me, null, 2);

        } catch (err) {
            out.style.color = 'red';
            out.textContent = 'Bạn chưa đăng nhập hoặc không lấy được thông tin.';
            setTimeout(() => location.href = '/login.html', 900);
        }
    })();

    btnLogout.addEventListener('click', async () => {
        try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); }
        catch {}
        location.href = '/login.html';
    });
});
