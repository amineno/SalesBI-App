-- Final Schema Patch
USE salesbi_db;

-- 1. Fix Orders Status ENUM (Adding 'accepted')
ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'accepted', 'processing', 'completed', 'cancelled') DEFAULT 'pending';

-- 2. Fix Audit Logs Structure
ALTER TABLE audit_logs MODIFY COLUMN data_snapshot JSON;
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN os VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN device VARCHAR(50);

-- 3. Ensure customers have business columns
ALTER TABLE customers ADD COLUMN company VARCHAR(150);
ALTER TABLE customers ADD COLUMN total_spent DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN last_purchase DATETIME NULL;

-- 4. Fix Users Table (Ensuring all security columns)
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN password_updated_at DATETIME NULL;

-- 5. Fix Products 
ALTER TABLE products ADD COLUMN cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN description TEXT;

-- 6. Add Missing Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_sku ON products(sku);
