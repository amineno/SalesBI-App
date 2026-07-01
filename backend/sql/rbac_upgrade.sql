-- Seed Advanced Enterprise Roles
INSERT IGNORE INTO roles (name) VALUES 
('Super Admin'),
('Manager'),
('Sales Representative'),
('Inventory Manager'),
('Accountant'),
('Viewer');

-- Create Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'orders.approve'
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Role-Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Seed Basic Permissions
INSERT IGNORE INTO permissions (name, code, description) VALUES
('View Dashboard', 'dashboard.view', 'Ability to view main dashboard'),
('Manage Products', 'products.manage', 'Create, update, and delete products'),
('View Inventory', 'inventory.view', 'View stock levels'),
('Adjust Stock', 'inventory.adjust', 'Manually adjust stock counts'),
('Manage Customers', 'customers.manage', 'Create and edit customers'),
('Create Orders', 'orders.create', 'Ability to place new orders'),
('Approve Orders', 'orders.approve', 'Ability to accept/reject pending orders'),
('Delete Orders', 'orders.delete', 'Ability to delete order records'),
('View Reports', 'reports.view', 'Access sales and performance reports'),
('Manage Users', 'users.manage', 'Create and edit staff accounts'),
('View Audit Logs', 'audit.view', 'View system activity logs'),
('Manage Settings', 'settings.manage', 'Change company and system settings');
