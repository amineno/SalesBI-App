-- FORCE REPAIR SCHEMA - SCRIPT 000
USE salesbi_db;

-- 1. Fix Products Table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0.00 AFTER price,
ADD COLUMN IF NOT EXISTS description TEXT AFTER sku,
ADD COLUMN IF NOT EXISTS tenant_id INT NOT NULL DEFAULT 1;

-- 2. Fix Users Table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0 AFTER role_id,
ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL AFTER failed_login_attempts,
ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL AFTER locked_until,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER last_login_at,
ADD COLUMN IF NOT EXISTS password_updated_at DATETIME NULL AFTER email_verified;

-- 3. Fix Inventory Table
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS tenant_id INT NOT NULL DEFAULT 1;

-- 4. Ensure Roles are seeded correctly
INSERT IGNORE INTO roles (id, name) VALUES (1, 'Admin'), (2, 'User'), (3, 'Super Admin'), (4, 'Manager');

-- 5. Fix Audit Logs
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255) AFTER ip_address,
ADD COLUMN IF NOT EXISTS os VARCHAR(50) AFTER user_agent,
ADD COLUMN IF NOT EXISTS device VARCHAR(50) AFTER os;
