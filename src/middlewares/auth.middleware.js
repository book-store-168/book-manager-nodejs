exports.ensureAuth = (req, res, next) => {
    const hasSessionUser = !!req.session?.user;
    const hasPassportUser =
        typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : !!req.user;

    if (hasSessionUser || hasPassportUser) return next();
    return res.status(401).json({ message: 'Chưa đăng nhập' });
};
exports.ensureAdmin = (req, res, next) => {
    if (req.session?.user?.role === 'ADMIN') return next();
    return res.status(403).json({message: 'Không có quyền truy cập'});
};

