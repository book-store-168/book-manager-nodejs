const express = require('express');
const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const { ensureAuth } = require('../middlewares/auth.middleware');
const userCtrl = require('../controllers/auth.login.controller');

// GET profile (function đơn -> bọc asyncHandler)
router.get('/profile', ensureAuth, asyncHandler(userCtrl.me));

// PUT profile (MẢNG middleware -> SPREAD, KHÔNG bọc asyncHandler)
router.put('/profile', ensureAuth, ...userCtrl.updateProfile);

module.exports = router;
