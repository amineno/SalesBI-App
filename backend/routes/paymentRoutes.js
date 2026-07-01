const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const pool = require('../config/db');
const logger = require('../utils/logger');
const socketService = require('../services/socketService');

// Use express.raw() for the webhook to verify the signature
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = await paymentService.constructEvent(req.body, sig);
    } catch (err) {
        logger.error('Webhook signature verification failed', { error: err.message });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.client_reference_id;

        logger.info('Payment received for order', { orderId, sessionId: session.id });

        try {
            await pool.query(
                'UPDATE orders SET payment_status = "paid", status = "processing" WHERE id = ?',
                [orderId]
            );
            
            socketService.emit('order:update', { id: orderId, status: 'processing', payment_status: 'paid' });
            logger.info('Order status updated via webhook', { orderId });
        } catch (err) {
            logger.error('Failed to update order after payment', { orderId, error: err.message });
        }
    }

    res.json({ received: true });
});

module.exports = router;
