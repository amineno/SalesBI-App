-- FORCE UNLOCK SCRIPT
USE salesbi_db;

UPDATE users 
SET failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'nouiouidev404@dev.com';

-- Ensure the user has the Admin role just in case
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) 
WHERE email = 'nouiouidev404@dev.com';
