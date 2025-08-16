const pool = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.id, b.title, b.author, b.price, b.image, b.description, b.category_id, b.created_at, b.sold,
              c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       ORDER BY b.created_at DESC`
        );
        res.json(rows);
    } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.*, c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.id=?`, [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Book not found' });
        res.json(rows[0]);
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const { title, author, price, image, description, category_id } = req.body;
        if (!title?.trim() || !author?.trim() || price == null)
            return res.status(400).json({ message: 'title, author, price are required' });

        const [r] = await pool.query(
            `INSERT INTO books (title, author, price, image, description, category_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [title.trim(), author.trim(), +price, image || null, description || null, category_id || null]
        );
        res.status(201).json({ id: r.insertId });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const { title, author, price, image, description, category_id, sold } = req.body;
        const id = req.params.id;

        const [r] = await pool.query(
            `UPDATE books
       SET title=?, author=?, price=?, image=?, description=?, category_id=?, sold=COALESCE(?, sold)
       WHERE id=?`,
            [title || null, author || null, price ?? null, image || null, description || null, category_id ?? null, sold ?? null, id]
        );
        if (!r.affectedRows) return res.status(404).json({ message: 'Book not found' });
        res.json({ id: +id });
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        const [r] = await pool.query('DELETE FROM books WHERE id=?', [req.params.id]);
        if (!r.affectedRows) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Deleted' });
    } catch (e) { next(e); }
};
