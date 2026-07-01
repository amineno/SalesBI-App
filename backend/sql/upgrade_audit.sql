-- Expand Audit Logs table
ALTER TABLE audit_logs
ADD COLUMN user_agent VARCHAR(255) NULL,
ADD COLUMN os VARCHAR(50) NULL,
ADD COLUMN device VARCHAR(50) NULL,
ADD COLUMN session_id VARCHAR(100) NULL;

-- Index for session tracking
CREATE INDEX idx_audit_session ON audit_logs(session_id);
