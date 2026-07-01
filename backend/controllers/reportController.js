const pool = require('../config/db');
const { getDateRange } = require('../utils/dateUtils');

// @desc    Advanced Revenue Report
exports.getRevenueReport = async (req, res) => {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);
    
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const userFilter = isAdmin ? '' : ' AND created_by = ?';
        const params = isAdmin ? [start, end] : [start, end, req.user.id];

        const [rows] = await pool.query(`
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m-%d') as date, 
                SUM(total_amount) as revenue,
                COUNT(*) as order_count
            FROM orders
            WHERE (order_date BETWEEN ? AND ?) 
              AND status IN ('accepted', 'completed')
              ${userFilter}
            GROUP BY date
            ORDER BY date ASC
        `, params);

        // Fill gaps in the results
        const results = [];
        const curr = new Date(start);
        const endDay = new Date(end < new Date() ? end : new Date());
        
        while (curr <= endDay) {
            const dateStr = curr.toISOString().split('T')[0];
            const existing = rows.find(r => r.date === dateStr);
            results.push({
                date: dateStr,
                revenue: existing ? parseFloat(existing.revenue || 0) : 0,
                order_count: existing ? existing.order_count : 0
            });
            curr.setDate(curr.getDate() + 1);
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategoryPerformance = async (req, res) => {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const userFilter = isAdmin ? '' : ' AND o.created_by = ?';
        const params = isAdmin ? [start, end] : [start, end, req.user.id];

        const [rows] = await pool.query(`
            SELECT 
                p.category, 
                SUM(oi.total_price) as total_revenue,
                SUM(oi.quantity) as total_quantity
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.order_date BETWEEN ? AND ?
              AND o.status IN ('accepted', 'completed')
              ${userFilter}
            GROUP BY p.category
            ORDER BY total_revenue DESC
        `, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Inventory Valuation
exports.getInventoryValuation = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied: Internal inventory intelligence is restricted to administrators.' });
        }

        const [rows] = await pool.query(`
            SELECT 
                SUM(p.price * i.quantity) as total_value,
                SUM(p.cost * i.quantity) as total_cost,
                SUM((p.price - p.cost) * i.quantity) as potential_profit
            FROM products p
            JOIN inventory i ON p.id = i.product_id
        `);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Advanced Business Intelligence
exports.getAdvancedBI = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        const userFilter = isAdmin ? '' : ' AND created_by = ?';
        const customerFilter = isAdmin ? '' : ' AND assigned_to = ?';
        const params = isAdmin ? [] : [req.user.id];

        // 1. Customer Lifetime Value (CLV)
        const [clvRows] = await pool.query(`
            SELECT 
                id, 
                full_name, 
                total_spent,
                DATEDIFF(NOW(), created_at) as account_age_days
            FROM customers
            WHERE total_spent > 0 ${customerFilter}
            ORDER BY total_spent DESC
            LIMIT 10
        `, params);

        // 2. Linear Forecasting (Simple Trend)
        const [historicalSales] = await pool.query(`
            SELECT 
                MONTH(order_date) as month,
                SUM(total_amount) as revenue
            FROM orders
            WHERE (order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)) ${userFilter}
            GROUP BY MONTH(order_date)
            ORDER BY order_date ASC
        `, params);

        // Simple Forecast Logic: Average growth rate
        let forecast = [];
        if (historicalSales.length >= 2) {
            const growthRates = [];
            for (let i = 1; i < historicalSales.length; i++) {
                const prev = historicalSales[i-1].revenue;
                const curr = historicalSales[i].revenue;
                growthRates.push((curr - prev) / prev);
            }
            const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
            
            let lastRevenue = historicalSales[historicalSales.length - 1].revenue;
            for (let i = 1; i <= 3; i++) {
                lastRevenue = lastRevenue * (1 + avgGrowth);
                forecast.push({ 
                    month: `Next ${i}`,  projectedRevenue: parseFloat(lastRevenue.toFixed(2)) 
                });
            }
        }

        res.json({
            topCustomersCLV: clvRows,
            revenueForecast: forecast,
            growthRate: historicalSales.length >= 2 ? 
                (((historicalSales[historicalSales.length-1].revenue - historicalSales[0].revenue) / historicalSales[0].revenue) * 100).toFixed(1) : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
