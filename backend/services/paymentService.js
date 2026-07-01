const env = require('../config/env');
const logger = require('../utils/logger');

let stripe;
try {
    if (env.stripeSecretKey && !env.stripeSecretKey.includes('placeholder')) {
        stripe = require('stripe')(env.stripeSecretKey);
    } else {
        logger.warn('Stripe Secret Key is missing or using placeholder. Payment features will not work.');
    }
} catch (error) {
    logger.error('Failed to initialize Stripe', { error: error.message });
}

class PaymentService {
    async createCheckoutSession(order, customer, items) {
        if (!stripe) {
            throw new Error('Stripe is not configured. Please provide a valid STRIPE_SECRET_KEY in your environment variables.');
        }

        try {
            const lineItems = items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.product_name,
                        metadata: {
                            product_id: item.product_id
                        }
                    },
                    unit_amount: Math.round(item.unit_price * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            }));

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${env.clientUrl}/orders/${order.id}?status=success`,
                cancel_url: `${env.clientUrl}/orders/${order.id}?status=cancelled`,
                customer_email: customer.email,
                client_reference_id: order.id.toString(),
                metadata: {
                    order_id: order.id
                }
            });

            return session;
        } catch (error) {
            logger.error('Stripe session creation failed', { orderId: order.id, error: error.message });
            throw error;
        }
    }

    async constructEvent(body, signature) {
        if (!stripe) {
            throw new Error('Stripe is not configured. Webhooks cannot be processed.');
        }
        return stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
    }
}

module.exports = new PaymentService();
