-- Script to add missing security columns to users table
USE salesbi_db;

ALTER TABLE users
ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER role_id,
ADD COLUMN locked_until DATETIME NULL AFTER failed_login_attempts,
ADD COLUMN last_login_at DATETIME NULL AFTER locked_until,
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER last_login_at,
ADD COLUMN password_updated_at DATETIME NULL AFTER email_verified;
