-- Create Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(100) UNIQUE,
    api_key VARCHAR(100) UNIQUE,
    status ENUM('active', 'suspended', 'trial') DEFAULT 'trial',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Tenant
INSERT IGNORE INTO tenants (id, name, domain, status) VALUES (1, 'Default Enterprise', 'localhost', 'active');

-- Add tenant_id to core tables
ALTER TABLE users ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE customers ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE settings ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- Add Foreign Keys
ALTER TABLE users ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE products ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE customers ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE orders ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id);
