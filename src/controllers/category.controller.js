const pool = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories WHERE id=?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Category not found' });
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name } = req.body;
        const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { name } = req.body;
        const [result] = await pool.query('UPDATE categories SET name=? WHERE id=?', [name, req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Category not found' });
        res.json({ id: req.params.id, name });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        next(err);
    }
};
