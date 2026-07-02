-- MASTER UNLOCK & RESET
USE salesbi_db;

-- 1. Reset user: nouiouidev404@dev.com
-- Password hash for 'Admin123!'
UPDATE users 
SET password = '$2b$12$WDNZE1X47xMmfQKafQEqDenwTT33h7kBQwHCdURsIltKJZaYn2I32', 
    failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'nouiouidev404@dev.com';

-- Ensure Admin role
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) 
WHERE email = 'nouiouidev404@dev.com';
