-- INDEPENDENT COMMANDS REPAIR SCRIPT
USE salesbi_db;

-- 1. Fix Products Table (Individual commands)
ALTER TABLE products ADD COLUMN cost DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- 2. Fix Users Table (Individual commands)
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN password_updated_at DATETIME NULL;

-- 3. Fix Inventory Table
ALTER TABLE inventory ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- 4. Fix Audit Logs
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN os VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN device VARCHAR(50);

-- 5. Seed Core Roles
INSERT IGNORE INTO roles (id, name) VALUES (1, 'Admin');
INSERT IGNORE INTO roles (id, name) VALUES (2, 'User');
INSERT IGNORE INTO roles (id, name) VALUES (3, 'Super Admin');
INSERT IGNORE INTO roles (id, name) VALUES (4, 'Manager');
