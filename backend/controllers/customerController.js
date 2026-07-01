const pool = require('../config/db');
const { withTransaction } = require('../utils/db');
const { insertAuditLog } = require('../utils/audit');

// @desc    Get all customers
// @route   GET /api/customers
exports.getCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, 
                   COALESCE(SUM(o.total_amount), 0) as total_spent,
                   MAX(o.order_date) as last_purchase
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('accepted', 'completed')
            WHERE 1=1
        `;
        const queryParams = [];

        // Role-based filtering
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        if (!isAdmin) {
            query += ' AND c.assigned_to = ?';
            queryParams.push(req.user.id);
        }

        if (search) {
            query += ' AND (c.full_name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY c.id ORDER BY total_spent DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, queryParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
        const countParams = [];
        if (!isAdmin) {
            countQuery += ' AND assigned_to = ?';
            countParams.push(req.user.id);
        }
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get customer by ID with history
// @route   GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
    const { id } = req.params;
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = 'SELECT * FROM customers WHERE id = ?';
        const params = [id];

        if (!isAdmin) {
            query += ' AND assigned_to = ?';
            params.push(req.user.id);
        }

        const [customerResult] = await pool.query(query, params);
        if (customerResult.length === 0) return res.status(404).json({ error: 'Customer not found or access denied' });
        
        const customer = customerResult[0];

        // Recalculate stats dynamically for accuracy
        const [stats] = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_spent,
                MAX(order_date) as last_purchase
            FROM orders
            WHERE customer_id = ? AND status IN ('accepted', 'completed')
        `, [id]);

        const [orders] = await pool.query(`
            SELECT o.*, COUNT(oi.id) as itemCount
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.customer_id = ?
            GROUP BY o.id
            ORDER BY o.order_date DESC
        `, [id]);

        res.json({ 
            ...customer, 
            total_spent: parseFloat(stats[0].total_spent),
            last_purchase: stats[0].last_purchase,
            orders 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create customer
// @route   POST /api/customers
exports.createCustomer = async (req, res) => {
    const { full_name, email, phone, company } = req.body;
    try {
        // Validation: Role-based restrictions
        if (req.user.role === 'User') {
            let userEmail = req.user.email;
            if (!userEmail) {
                const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
                userEmail = users[0]?.email;
            }
            if (userEmail !== email) {
                return res.status(403).json({ error: 'You are only authorized to sync your own identity.' });
            }
        }
        const customerId = await withTransaction(async (connection) => {
            const [result] = await connection.query(
                'INSERT INTO customers (full_name, email, phone, company, assigned_to) VALUES (?, ?, ?, ?, ?)',
                [full_name, email, phone, company, req.user.id]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'CREATE_CUSTOMER',
                table: 'customers',
                snapshot: { id: result.insertId, full_name, email },
                ipAddress: req.ip
            });

            return result.insertId;
        });

        res.status(201).json({ id: customerId, message: 'Customer created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, company } = req.body;
    try {
        await withTransaction(async (connection) => {
            const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
            let selectQuery = 'SELECT id FROM customers WHERE id = ?';
            const selectParams = [id];
            if (!isAdmin) {
                selectQuery += ' AND assigned_to = ?';
                selectParams.push(req.user.id);
            }
            const [customer] = await connection.query(selectQuery, selectParams);
            if (customer.length === 0) throw new Error('Customer not found or access denied');

            await connection.query(
                'UPDATE customers SET full_name=?, email=?, phone=?, company=? WHERE id=?',
                [full_name, email, phone, company, id]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'UPDATE_CUSTOMER',
                table: 'customers',
                snapshot: { id, full_name, email },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'Customer updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        await withTransaction(async (connection) => {
            const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
            let selectQuery = 'SELECT full_name, email FROM customers WHERE id = ?';
            const selectParams = [id];
            if (!isAdmin) {
                selectQuery += ' AND assigned_to = ?';
                selectParams.push(req.user.id);
            }

            const [customer] = await connection.query(selectQuery, selectParams);
            if (customer.length === 0) throw new Error('Customer not found or access denied');

            // Delete associated orders (order_items will cascade delete)
            await connection.query('DELETE FROM orders WHERE customer_id = ?', [id]);

            // Now delete the customer
            await connection.query('DELETE FROM customers WHERE id = ?', [id]);

            if (customer.length > 0) {
                await insertAuditLog(connection, {
                    userId: req.user.id,
                    action: 'DELETE_CUSTOMER',
                    table: 'customers',
                    snapshot: { id, ...customer[0] },
                    ipAddress: req.ip
                });
            }
        });

        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
