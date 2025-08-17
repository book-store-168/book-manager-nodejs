const app = require('./app');
const express = require('express');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
const userRoutes = require('./routes/auth.routes');
app.use(express.json());              // đảm bảo parser JSON trước khi mount routes
app.use('/api/users', userRoutes);