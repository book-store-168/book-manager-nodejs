// src/routes/index.js
const express = require('express');
const router = express.Router();

// Route đơn lẻ (nếu cần): kiểm tra API root
router.get('/', (req, res) => res.json({ message: 'Welcome to Book Store API' }));

// Mount các nhóm route con
router.use('/api/categories', require('./category.routes'));
router.use('/api/books', require('./book.routes')); // có thể thêm sau

module.exports = router;

