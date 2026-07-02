-- COMPREHENSIVE REPAIR SCRIPT v2
USE salesbi_db;

-- 1. Fix Products Table
ALTER TABLE products ADD COLUMN cost DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- 2. Fix Users Table 
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN password_updated_at DATETIME NULL;

-- 3. Fix Customers Table (The latest identified gap)
ALTER TABLE customers ADD COLUMN company VARCHAR(150) AFTER phone;
ALTER TABLE customers ADD COLUMN total_spent DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN last_purchase DATETIME NULL;

-- 4. Fix Inventory Table
ALTER TABLE inventory ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- 5. Fix Audit Logs
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN os VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN device VARCHAR(50);

-- 6. Ensure Roles exist
INSERT IGNORE INTO roles (id, name) VALUES (1, 'Admin'), (2, 'User'), (3, 'Super Admin'), (4, 'Manager');
