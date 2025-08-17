const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middlewares/auth.middleware');
const userCtrl = require('../controllers/user.controller');

router.get('/me', ensureAuth, userCtrl.getMe);

// nhận mọi kiểu gọi từ FE
router.patch('/me', ensureAuth, userCtrl.updateMe);
router.put('/me',   ensureAuth, userCtrl.updateMe);
router.post('/update-profile', ensureAuth, userCtrl.updateMe);

module.exports = router;

