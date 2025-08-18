(function () {
    const alertBox = document.getElementById('alert');
    const showAlert = (type, msg) => {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
    };

    // Prefill
    (async () => {
        try {
            const meRes = await fetch('/api/auth/me', { credentials: 'include' });
            const payload = await meRes.json();
            if (!meRes.ok) throw new Error(payload.message || 'Không lấy được thông tin người dùng');
            const user = payload.user || payload.data || payload;

            document.getElementById('name').value    = user.name    || '';
            document.getElementById('email').value   = user.email   || '';
            document.getElementById('phone').value   = user.phone   || '';
            document.getElementById('address').value = user.address || '';

            // dob -> yyyy-mm-dd
            if (user.dob) {
                const d = new Date(user.dob);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                document.getElementById('dob').value = `${yyyy}-${mm}-${dd}`;
            }
        } catch (e) {
            showAlert('warning', e.message || 'Chưa đăng nhập');
        }
    })();

    // Submit
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name    = document.getElementById('name').value.trim();
        const phone   = document.getElementById('phone').value.trim();
        const dob     = document.getElementById('dob').value; // yyyy-mm-dd
        const address = document.getElementById('address').value.trim();

        // Validate bắt buộc đủ trường
        if (!name || !phone || !dob || !address) {
            return showAlert('warning', 'Vui lòng nhập đầy đủ tất cả các trường');
        }

        // (Tuỳ chọn) Validate phone cơ bản: 9-11 chữ số, có thể bắt đầu bằng +
        const phoneOk = /^(\+?\d{9,11})$/.test(phone);
        if (!phoneOk) {
            return showAlert('warning', 'Số điện thoại không hợp lệ');
        }

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, phone, dob, address })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Ưu tiên hiển thị thông điệp trùng số điện thoại nếu backend trả về
                const msg = data?.message || 'Cập nhật thất bại';
                return showAlert('danger', msg);
            }

            showAlert('success', 'Cập nhật thành công! Đang chuyển hướng…');
            setTimeout(() => (window.location.href = '/profile.html'), 700);
        } catch (err) {
            showAlert('danger', err.message || 'Có lỗi xảy ra');
        }
    });
})();