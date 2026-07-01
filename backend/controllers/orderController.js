const pool = require('../config/db');
const { withTransaction } = require('../utils/db');
const { insertAuditLog } = require('../utils/audit');
const { notifyAdmins, createNotification } = require('../utils/notifications');
const socketService = require('../services/socketService');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

const inventoryImpactStatuses = new Set(['accepted', 'processing', 'completed']);

const adjustInventory = async (connection, items, direction) => {
    for (const item of items) {
        await connection.query(
            `UPDATE inventory
            SET quantity = quantity ${direction === 'deduct' ? '-' : '+'} ?
            WHERE product_id = ?`,
            [item.quantity, item.product_id]
        );
    }
    socketService.emit('inventory:update', { items, direction });
};

// @desc    Get all orders
// @route   GET /api/orders
exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, c.full_name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];

        // Role-based filtering
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        if (!isAdmin) {
            query += ' AND o.created_by = ?';
            queryParams.push(req.user.id);
        }

        if (search) {
            query += ' AND (c.full_name LIKE ? OR CAST(o.id AS CHAR) LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            query += ' AND o.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY o.order_date DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, queryParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE 1=1';
        const countParams = [];
        if (!isAdmin) {
            countQuery += ' AND o.created_by = ?';
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

// @desc    Get order details
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = `
            SELECT o.*, c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `;
        const params = [id];

        if (!isAdmin) {
            query += ' AND o.created_by = ?';
            params.push(req.user.id);
        }

        const [order] = await pool.query(query, params);

        if (order.length === 0) return res.status(404).json({ error: 'Order not found or access denied' });

        const [items] = await pool.query(`
            SELECT oi.*, p.name as product_name, p.sku
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        res.json({ ...order[0], items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    const { customer_id, items, status = 'pending' } = req.body;

    try {
        const orderId = await withTransaction(async (connection) => {
            let totalAmount = 0;
            for (const item of items) {
                totalAmount += item.quantity * item.unit_price;
            }

            const [orderResult] = await connection.query(
                'INSERT INTO orders (customer_id, total_amount, status, created_by) VALUES (?, ?, ?, ?)',
                [customer_id, totalAmount, status, req.user.id]
            );
            const createdOrderId = orderResult.insertId;

            for (const item of items) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [createdOrderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
                );
            }

            if (inventoryImpactStatuses.has(status)) {
                await adjustInventory(connection, items, 'deduct');
            }

            if (status === 'completed') {
                await connection.query(
                    'UPDATE customers SET total_spent = total_spent + ?, last_purchase = NOW() WHERE id = ?',
                    [totalAmount, customer_id]
                );
            }

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'CREATE_ORDER',
                table: 'orders',
                snapshot: { id: createdOrderId, totalAmount, customer_id, status },
                ipAddress: req.ip
            });

            return createdOrderId;
        });

        // Invalidate Dashboard Cache for all users (Real-time update)
        await cache.delByPrefix('dashboard:');

        // Notify admins of new order
        await notifyAdmins('ORDER_CREATED', `New order #${orderId} was placed and is awaiting approval.`);
        socketService.emitToRole('Admin', 'order:new', { id: orderId, status });

        // Send Order Confirmation Email to Customer
        try {
            const [[customer]] = await pool.query('SELECT full_name, email FROM customers WHERE id = ?', [customer_id]);
            const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
            
            // Enrich items with names if possible (or just use what's in request)
            // For simplicity, we use request items, but we need product names
            const [enrichedItems] = await pool.query(
                'SELECT p.name as product_name FROM products p WHERE p.id IN (?)',
                [items.map(i => i.product_id)]
            );
            const itemsWithNames = items.map((item, idx) => ({
                ...item,
                product_name: enrichedItems[idx]?.product_name || 'Product'
            }));

            await emailService.sendOrderConfirmation({ id: orderId, total_amount: totalAmount }, customer, itemsWithNames);
        } catch (err) {
            logger.warn('Failed to send order confirmation email', { orderId, error: err.message });
        }

        res.status(201).json({ id: orderId, message: 'Order created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updated = await withTransaction(async (connection) => {
            const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
            let selectQuery = 'SELECT id, customer_id, total_amount, status FROM orders WHERE id = ?';
            const selectParams = [id];

            if (!isAdmin) {
                selectQuery += ' AND created_by = ?';
                selectParams.push(req.user.id);
            }

            const [orders] = await connection.query(selectQuery, selectParams);

            if (orders.length === 0) {
                return false;
            }

            const order = orders[0];
            const [items] = await connection.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [id]
            );

            const hadInventoryImpact = inventoryImpactStatuses.has(order.status);
            const willInventoryImpact = inventoryImpactStatuses.has(status);

            if (!hadInventoryImpact && willInventoryImpact) {
                await adjustInventory(connection, items, 'deduct');
            } else if (hadInventoryImpact && !willInventoryImpact) {
                await adjustInventory(connection, items, 'restore');
            }

            if (order.status !== 'completed' && status === 'completed') {
                await connection.query(
                    'UPDATE customers SET total_spent = total_spent + ?, last_purchase = NOW() WHERE id = ?',
                    [order.total_amount, order.customer_id]
                );
            } else if (order.status === 'completed' && status !== 'completed') {
                await connection.query(
                    'UPDATE customers SET total_spent = GREATEST(total_spent - ?, 0) WHERE id = ?',
                    [order.total_amount, order.customer_id]
                );
            }

            await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'UPDATE_ORDER_STATUS',
                table: 'orders',
                snapshot: { id, previousStatus: order.status, status },
                ipAddress: req.ip
            });

            return true;
        });

        if (!updated) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Invalidate Dashboard Cache for all users (Real-time update)
        await cache.delByPrefix('dashboard:');

        // Notify system of status change
        const icon = status === 'accepted' ? '✅' : status === 'cancelled' ? '❌' : '📦';
        await notifyAdmins('ORDER_STATUS_UPDATE', `${icon} Order #${id} has been ${status} by ${req.user.full_name}`);
        socketService.emit('order:update', { id, status });

        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await withTransaction(async (connection) => {
            const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
            let selectQuery = 'SELECT id, customer_id, total_amount, status FROM orders WHERE id = ?';
            const selectParams = [id];

            if (!isAdmin) {
                selectQuery += ' AND created_by = ?';
                selectParams.push(req.user.id);
            }

            const [orders] = await connection.query(selectQuery, selectParams);

            if (orders.length === 0) {
                return false;
            }

            const order = orders[0];
            const [items] = await connection.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [id]
            );

            if (inventoryImpactStatuses.has(order.status)) {
                await adjustInventory(connection, items, 'restore');
            }

            if (order.status === 'completed') {
                await connection.query(
                    'UPDATE customers SET total_spent = GREATEST(total_spent - ?, 0) WHERE id = ?',
                    [order.total_amount, order.customer_id]
                );
            }

            await connection.query('DELETE FROM orders WHERE id = ?', [id]);

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'DELETE_ORDER',
                table: 'orders',
                snapshot: { id, status: order.status },
                ipAddress: req.ip
            });

            return true;
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Invalidate Dashboard Cache
        await cache.delByPrefix('dashboard:');

        socketService.emit('order:delete', { id });

        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create payment session
// @route   POST /api/orders/:id/payment
exports.createPaymentSession = async (req, res) => {
    const { id } = req.params;

    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = `
            SELECT o.*, c.full_name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `;
        const params = [id];

        if (!isAdmin) {
            query += ' AND o.created_by = ?';
            params.push(req.user.id);
        }

        const [orders] = await pool.query(query, params);

        if (orders.length === 0) return res.status(404).json({ error: 'Order not found or access denied' });
        const order = orders[0];

        const [items] = await pool.query(`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        const session = await paymentService.createCheckoutSession(order, { email: order.customer_email }, items);

        await pool.query('UPDATE orders SET stripe_session_id = ? WHERE id = ?', [session.id, id]);

        res.json({ url: session.url });
    } catch (err) {
        logger.error('Payment session creation failed', { orderId: id, error: err.message });
        res.status(500).json({ error: err.message });
    }
};

// @desc    Download invoice PDF
// @route   GET /api/orders/:id/invoice
exports.downloadInvoice = async (req, res) => {
    const { id } = req.params;

    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = `
            SELECT o.*, c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `;
        const params = [id];

        if (!isAdmin) {
            query += ' AND o.created_by = ?';
            params.push(req.user.id);
        }

        const [orders] = await pool.query(query, params);

        if (orders.length === 0) return res.status(404).json({ error: 'Order not found or access denied' });
        const order = orders[0];

        const [items] = await pool.query(`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        const pdfBuffer = await pdfService.generateInvoice(order, { 
            full_name: order.customer_name, 
            email: order.customer_email,
            phone: order.customer_phone
        }, items);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        logger.error('Invoice download failed', { orderId: id, error: err.message });
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
};
