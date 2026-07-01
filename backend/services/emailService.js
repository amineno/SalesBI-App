const sgMail = require('@sendgrid/mail');
const env = require('../config/env');
const logger = require('../utils/logger');

if (env.sendgridApiKey) {
    sgMail.setApiKey(env.sendgridApiKey);
}

class EmailService {
    async sendEmail({ to, subject, html, text }) {
        const msg = {
            to,
            from: {
                email: env.emailFrom,
                name: env.emailFromName
            },
            subject,
            text: text || subject,
            html
        };

        try {
            if (env.sendgridApiKey && env.nodeEnv === 'production') {
                await sgMail.send(msg);
                logger.info('Email sent successfully', { to, subject });
            } else {
                logger.info('Email Simulation (Development Mode):', {
                    to,
                    subject,
                    from: env.emailFrom,
                    // In real dev, we might want to log the html too but it's large
                    bodyPreview: text || subject
                });
                
                // For local development, we could also save to a file or a dedicated log
                // console.log('HTML CONTENT:', html);
            }
            return true;
        } catch (error) {
            logger.error('Email sending failed', { 
                to, 
                subject, 
                error: error.response ? error.response.body : error.message 
            });
            return false;
        }
    }

    // High-level methods for specific flows
    async sendWelcomeEmail(user) {
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #4f46e5;">Welcome to SalesBI Enterprise!</h1>
                <p>Hello ${user.full_name || 'there'},</p>
                <p>Your account has been successfully created. You can now access your dashboard and start managing your sales operations.</p>
                <div style="margin: 30px 0;">
                    <a href="${env.clientUrl}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Dashboard</a>
                </div>
                <p>If you have any questions, feel free to reply to this email.</p>
                <p>Best regards,<br>The SalesBI Team</p>
            </div>
        `;
        return this.sendEmail({
            to: user.email,
            subject: 'Welcome to SalesBI Enterprise',
            html,
            text: `Welcome to SalesBI Enterprise, ${user.full_name}! Login here: ${env.clientUrl}/login`
        });
    }

    async sendPasswordResetEmail(user, resetUrl) {
        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                </div>
                <p>If you didn't request this, you can safely ignore this email. This link will expire in ${env.resetTokenExpiresMinutes} minutes.</p>
                <p>Best regards,<br>The SalesBI Team</p>
            </div>
        `;
        return this.sendEmail({
            to: user.email,
            subject: 'Password Reset Request - SalesBI',
            html,
            text: `Reset your password here: ${resetUrl}`
        });
    }

    async sendOrderConfirmation(order, customer, items) {
        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toFixed(2)}</td>
            </tr>
        `).join('');

        const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Order Confirmation</h2>
                <p>Hello ${customer.full_name},</p>
                <p>Thank you for your order! Your order #<strong>${order.id}</strong> has been received and is currently being processed.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 8px; text-align: left;">Product</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 8px; font-weight: bold; text-align: right;">Total:</td>
                            <td style="padding: 8px; font-weight: bold; text-align: right;">$${order.total_amount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <p>We will notify you once your order has been accepted.</p>
                <p>Best regards,<br>The SalesBI Team</p>
            </div>
        `;
        return this.sendEmail({
            to: customer.email,
            subject: `Order Confirmation #${order.id} - SalesBI`,
            html,
            text: `Thank you for your order #${order.id}. Total amount: $${order.total_amount.toFixed(2)}`
        });
    }
}

module.exports = new EmailService();
