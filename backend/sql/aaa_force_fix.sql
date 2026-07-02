-- AUDIT LOG REPAIR
USE salesbi_db;

-- Remove the old camelCase column if it exists to avoid confusion
-- (Wrap in error-tolerant migration service)
ALTER TABLE audit_logs DROP COLUMN userAgent;

-- Ensure the correct lowercase columns exist
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN os VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN device VARCHAR(50);

-- Ensure user is unlocked again
UPDATE users 
SET failed_login_attempts = 0, 
    locked_until = NULL 
WHERE email = 'nouiouidev404@dev.com';
