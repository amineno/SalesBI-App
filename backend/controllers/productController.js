const pool = require('../config/db');
const { withTransaction } = require('../utils/db');
const { insertAuditLog } = require('../utils/audit');
const { notifyAdmins } = require('../utils/notifications');

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = '', sort = 'created_at', order = 'DESC' } = req.query;
        const limitNum = parseInt(limit) || 10;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;

        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);

        let query = `
            SELECT p.id, p.name, p.category, p.price, ${isAdmin ? 'p.cost,' : ''} p.sku, p.description, p.created_at, p.image_url,
                   i.quantity, i.low_stock_threshold 
            FROM products p 
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE 1=1
        `;
        const queryParams = [];

        if (search) {
            query += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ` AND p.category = ?`;
            queryParams.push(category);
        }

        // Sorting
        const allowedSort = ['name', 'price', 'category', 'created_at', 'quantity'];
        const sortField = allowedSort.includes(sort) ? sort : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField === 'quantity' ? 'i.quantity' : `p.${sortField}`} ${sortOrder}`;

        // Pagination
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limitNum, offset);

        const [rows] = await pool.query(query, queryParams);
        
        // Get total count for pagination
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products');
        const [lowStockResult] = await pool.query('SELECT COUNT(*) as lowStock FROM inventory WHERE quantity <= low_stock_threshold');
        const [activeResult] = await pool.query('SELECT COUNT(*) as active FROM inventory WHERE quantity > low_stock_threshold');
        const total = countResult[0].total;

        res.json({
            data: rows,
            pagination: {
                total,
                lowStockCount: lowStockResult[0].lowStock,
                activeCount: activeResult[0].active,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create new product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
    const { name, category, price, cost, sku, description, quantity, low_stock_threshold } = req.body;
    try {
        const productId = await withTransaction(async (connection) => {
            const [result] = await connection.query(
                'INSERT INTO products (name, category, price, cost, sku, description) VALUES (?, ?, ?, ?, ?, ?)',
                [name, category, price || 0, cost || 0, sku, description]
            );
            const insertedProductId = result.insertId;

            await connection.query(
                'INSERT INTO inventory (product_id, quantity, low_stock_threshold) VALUES (?, ?, ?)',
                [insertedProductId, quantity || 0, low_stock_threshold || 10]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'CREATE_PRODUCT',
                table: 'products',
                snapshot: { id: insertedProductId, name, sku },
                ipAddress: req.ip
            });

            return insertedProductId;
        });

        res.status(201).json({ id: productId, message: 'Product created successfully' });
        
        // Notify of new product
        await notifyAdmins('PRODUCT_CREATED', `🆕 New product "${name}" (SKU: ${sku}) added to inventory.`);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Product with SKU "${sku}" already exists` });
        }
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category, price, cost, sku, description, quantity, low_stock_threshold } = req.body;
    try {
        await withTransaction(async (connection) => {
            await connection.query(
                'UPDATE products SET name=?, category=?, price=?, cost=?, sku=?, description=? WHERE id=?',
                [name, category, price, cost, sku, description, id]
            );

            await connection.query(
                'UPDATE inventory SET quantity=?, low_stock_threshold=? WHERE product_id=?',
                [quantity, low_stock_threshold, id]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'UPDATE_PRODUCT',
                table: 'products',
                snapshot: { id, name, sku },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'Product updated successfully' });

        // Notify of update
        await notifyAdmins('PRODUCT_UPDATED', `📝 Product "${name}" was updated by ${req.user.full_name}`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await withTransaction(async (connection) => {
            const [product] = await connection.query('SELECT name, sku FROM products WHERE id = ?', [id]);

            await connection.query('DELETE FROM products WHERE id = ?', [id]);

            if (product.length > 0) {
                await insertAuditLog(connection, {
                    userId: req.user.id,
                    action: 'DELETE_PRODUCT',
                    table: 'products',
                    snapshot: { id, ...product[0] },
                    ipAddress: req.ip
                });
            }
        });

        res.json({ message: 'Product deleted successfully' });

        // Notify of deletion
        await notifyAdmins('PRODUCT_DELETED', `🗑️ Product ID ${id} was removed from the catalog.`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
exports.bulkDeleteProducts = async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No IDs provided' });
    }

    try {
        await withTransaction(async (connection) => {
            // Get names for audit/notifications before deletion
            const [products] = await connection.query('SELECT id, name FROM products WHERE id IN (?)', [ids]);
            
            await connection.query('DELETE FROM products WHERE id IN (?)', [ids]);

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'BULK_DELETE_PRODUCTS',
                table: 'products',
                snapshot: { count: products.length, ids },
                ipAddress: req.ip
            });
        });

        res.json({ message: `${ids.length} products deleted successfully` });
        await notifyAdmins('PRODUCT_DELETED', `🧨 Bulk deletion: ${ids.length} products were removed.`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Upload product image
// @route   POST /api/products/:id/image
exports.uploadProductImage = async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, id]);

        await insertAuditLog(pool, {
            userId: req.user.id,
            action: 'UPLOAD_PRODUCT_IMAGE',
            table: 'products',
            snapshot: { id, imageUrl },
            ipAddress: req.ip
        });

        res.json({ message: 'Image uploaded successfully', imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
