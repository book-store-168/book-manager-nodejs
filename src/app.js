const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./config/session');
const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/', routes);

// error handler cuối cùng
app.use((err, req, res, next) => {
    console.error(err);
    const code = err.status || 500;
    res.status(code).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
