const pool = require('../config/db');
const cache = require('../utils/cache');

exports.getKpis = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const cacheKey = `dashboard:kpis:${isAdmin ? 'global' : req.user.id}`;
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const userFilter = isAdmin ? '' : ' AND created_by = ?';
        const customerFilter = isAdmin ? '' : ' AND assigned_to = ?';
        const params = isAdmin ? [] : [req.user.id];

        // 1. Current Period KPIs (This Month)
        const [currentStats] = await pool.query(`
            SELECT SUM(total_amount) as revenue, COUNT(*) as orders
            FROM orders 
            WHERE status IN ("accepted", "completed") AND order_date >= ? ${userFilter}
        `, [startOfMonth, ...params]);

        const [currentCustomers] = await pool.query(`
            SELECT COUNT(*) as count FROM customers WHERE created_at >= ? ${customerFilter}
        `, [startOfMonth, ...params]);

        // 2. Previous Period KPIs (Last Month)
        const [prevStats] = await pool.query(`
            SELECT SUM(total_amount) as revenue, COUNT(*) as orders
            FROM orders 
            WHERE status IN ("accepted", "completed") AND order_date >= ? AND order_date <= ? ${userFilter}
        `, [startOfLastMonth, endOfLastMonth, ...params]);

        const [prevCustomers] = await pool.query(`
            SELECT COUNT(*) as count FROM customers WHERE created_at >= ? AND created_at <= ? ${customerFilter}
        `, [startOfLastMonth, endOfLastMonth, ...params]);

        // 3. Totals (All Time)
        const [totalStats] = await pool.query(`SELECT SUM(total_amount) as revenue, COUNT(*) as orders FROM orders WHERE status IN ("accepted", "completed") ${userFilter}`, params);
        const [totalCustomers] = await pool.query(`SELECT COUNT(*) as count FROM customers WHERE 1=1 ${customerFilter}`, params);
        
        let profitMargin = 0;
        let lowStockCount = 0;

        if (isAdmin) {
            const [totalProfit] = await pool.query(`
                SELECT SUM(oi.total_price - (p.cost * oi.quantity)) as profit
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status IN ("accepted", "completed")
            `);
            const [lowStock] = await pool.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= low_stock_threshold');
            profitMargin = totalStats[0].revenue > 0 ? ((totalProfit[0].profit || 0) / totalStats[0].revenue) * 100 : 0;
            lowStockCount = lowStock[0].count;
        }

        // Calculate Trends
        const calcTrend = (curr, prev) => {
            if (!prev || prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const revenueTrend = calcTrend(currentStats[0].revenue || 0, prevStats[0].revenue || 0);
        const ordersTrend = calcTrend(currentStats[0].orders || 0, prevStats[0].orders || 0);
        const customerTrend = calcTrend(currentCustomers[0].count || 0, prevCustomers[0].count || 0);

        const responseData = {
            totalRevenue: parseFloat(totalStats[0].revenue || 0),
            revenueTrend: revenueTrend.toFixed(1),
            totalOrders: totalStats[0].orders || 0,
            ordersTrend: ordersTrend.toFixed(1),
            totalCustomers: totalCustomers[0].count || 0,
            customerTrend: customerTrend.toFixed(1),
            lowStockCount: isAdmin ? lowStockCount : undefined,
            profitMargin: isAdmin ? profitMargin : undefined,
            recentActivity: undefined
        };

        if (!isAdmin) {
            const [lastOrder] = await pool.query(
                'SELECT status, order_date FROM orders WHERE created_by = ? ORDER BY order_date DESC LIMIT 1',
                [req.user.id]
            );
            if (lastOrder.length > 0) {
                responseData.recentActivity = {
                    type: 'order',
                    status: lastOrder[0].status,
                    date: lastOrder[0].order_date
                };
            }
        } else {
            const [lastLog] = await pool.query(
                'SELECT action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 1'
            );
            if (lastLog.length > 0) {
                responseData.recentActivity = {
                    type: 'audit',
                    action: lastLog[0].action,
                    date: lastLog[0].created_at
                };
            }
        }

        await cache.set(cacheKey, responseData, 30); // 30 seconds for live feel

        res.json(responseData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSalesTrend = async (req, res) => {
    const { range } = req.query; // daily, weekly, monthly
    const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
    const cacheKey = `dashboard:salestrend:${range || 'daily'}:${isAdmin ? 'global' : req.user.id}`;
    
    try {
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        let format = '%Y-%m-%d';
        if (range === 'monthly') format = '%Y-%m';

        const userFilter = isAdmin ? '' : ' AND created_by = ?';
        const params = isAdmin ? [format] : [format, req.user.id];

        const [rows] = await pool.query(`
            SELECT DATE_FORMAT(order_date, ?) as period, SUM(total_amount) as revenue
            FROM orders
            WHERE status IN ("accepted", "completed") ${userFilter}
            GROUP BY period
            ORDER BY period ASC
        `, params);

        // Generate periods to fill gaps
        const results = [];
        const now = new Date();
        const iterations = range === 'monthly' ? 12 : 30;

        for (let i = iterations - 1; i >= 0; i--) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            if (range === 'monthly') {
                d.setMonth(now.getMonth() - i);
                d.setDate(1);
            } else {
                d.setDate(now.getDate() - i);
            }
            
            const period = range === 'monthly' 
                ? d.toISOString().slice(0, 7) // YYYY-MM
                : d.toISOString().slice(0, 10); // YYYY-MM-DD
            
            const existing = rows.find(r => r.period === period);
            results.push({
                period,
                revenue: existing ? parseFloat(existing.revenue || 0) : 0
            });
        }

        await cache.set(cacheKey, results, 30); // 30 seconds
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const cacheKey = `dashboard:top-products:${isAdmin ? 'global' : req.user.id}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(cached);

        const userFilter = isAdmin ? '' : ' AND o.created_by = ?';
        const params = isAdmin ? [] : [req.user.id];

        const [rows] = await pool.query(`
            SELECT p.name, SUM(oi.quantity) as totalQty, SUM(oi.total_price) as totalSales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE 1=1 ${userFilter}
            GROUP BY p.id, p.name
            ORDER BY totalSales DESC
            LIMIT 5
        `, params);

        await cache.set(cacheKey, rows, 30);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategoryDistribution = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const cacheKey = `dashboard:category-dist:${isAdmin ? 'global' : req.user.id}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(cached);

        const userFilter = isAdmin ? '' : ' AND o.created_by = ?';
        const params = isAdmin ? [] : [req.user.id];

        const [rows] = await pool.query(`
            SELECT p.category, SUM(oi.total_price) as value
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE 1=1 ${userFilter}
            GROUP BY p.category
            ORDER BY value DESC
        `, params);

        // Normalize data for Pie Chart (colors will be handled on frontend)
        const results = rows.map(r => ({
            name: r.category || 'Uncategorized',
            value: parseFloat(r.value || 0)
        }));

        await cache.set(cacheKey, results, 30);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrderStatusDist = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const userFilter = isAdmin ? '' : ' WHERE created_by = ?';
        const params = isAdmin ? [] : [req.user.id];

        const [rows] = await pool.query(`
            SELECT status as name, COUNT(*) as value
            FROM orders
            ${userFilter}
            GROUP BY status
        `, params);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getInventoryHealth = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                CASE 
                    WHEN quantity = 0 THEN 'Out of Stock'
                    WHEN quantity <= low_stock_threshold THEN 'Low Stock'
                    ELSE 'In Stock'
                END as name,
                COUNT(*) as value
            FROM inventory
            GROUP BY name
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
