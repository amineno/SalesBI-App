-- Data Isolation Migration
-- Version: 1.0

USE salesbi_db;

-- 1. Add created_by to orders
ALTER TABLE orders ADD COLUMN created_by INT NULL;
ALTER TABLE orders ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add assigned_to to customers
ALTER TABLE customers ADD COLUMN assigned_to INT NULL;
ALTER TABLE customers ADD FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Initialize data (optional: link existing orders/customers to an admin if id=1 exists)
UPDATE orders SET created_by = 1 WHERE created_by IS NULL;
UPDATE customers SET assigned_to = 1 WHERE assigned_to IS NULL;
