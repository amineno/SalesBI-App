-- Grant all current permissions to the Admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin';

-- Also grant to Super Admin for good measure, 
-- although the middleware has a bypass for 'Super Admin' name
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Super Admin';

-- Verify assignments
SELECT r.name as role, p.code as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Admin', 'Super Admin');
