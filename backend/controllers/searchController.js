const pool = require('../config/db');

exports.globalSearch = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ products: [], customers: [] });

    const searchTerm = `%${q}%`;

    try {
        const [products] = await pool.query(
            'SELECT id, name as title, "product" as type FROM products WHERE name LIKE ? OR sku LIKE ? LIMIT 5',
            [searchTerm, searchTerm]
        );

        const [customers] = await pool.query(
            'SELECT id, full_name as title, "customer" as type FROM customers WHERE full_name LIKE ? OR email LIKE ? LIMIT 5',
            [searchTerm, searchTerm]
        );

        const [orders] = await pool.query(
            'SELECT id, CAST(id AS CHAR) as title, "order" as type FROM orders WHERE id LIKE ? OR status LIKE ? LIMIT 5',
            [searchTerm, searchTerm]
        );

        res.json({ products, customers, orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
