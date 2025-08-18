document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('nav');
    // Use event delegation to handle clicks on btnLogout
    nav.addEventListener('click', async (e) => {
        if (e.target.id === 'btnLogout') {
            e.preventDefault(); // Prevent default link behavior
            try {
                const res = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include' // Send session cookies
                });
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Đăng xuất thành công');

                if (res.ok) {
                    // Update UI to reflect logged-out state
                    const out = document.getElementById('out');
                    out.style.color = '#333';
                    out.textContent = 'Chưa đăng nhập.';
                    nav.innerHTML = `
                        <a href="/register.html">Register</a> |
                        <a href="/login.html">Login</a>
                    `;
                    // Optionally redirect to login page
                    // window.location.href = '/login.html';
                } else {
                    throw new Error(data.message || 'Đăng xuất thất bại');
                }
            } catch (err) {
                console.error('Logout error:', err);
                alert('Có lỗi khi đăng xuất');
            }
        }
    });
});