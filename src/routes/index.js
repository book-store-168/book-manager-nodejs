// src/routes/index.js
const express = require('express');
const router = express.Router();

// Route test API
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to Book Store API' });
});

// Import và mount các route con ở đây
// Ví dụ sau này bạn có:
// router.use('/auth', require('./auth.routes'));
// router.use('/books', require('./books.routes'));
// router.use('/orders', require('./orders.routes'));

module.exports = router;
