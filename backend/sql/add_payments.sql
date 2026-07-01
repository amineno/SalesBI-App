-- Update Orders table to support Stripe Payments
ALTER TABLE orders
ADD COLUMN stripe_session_id VARCHAR(255) NULL,
ADD COLUMN payment_status ENUM('unpaid', 'paid', 'failed', 'refunded') DEFAULT 'unpaid' AFTER status;

-- Add index for session lookup
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);
