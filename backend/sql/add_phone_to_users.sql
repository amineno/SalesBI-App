-- Script to add phone column to users table
USE salesbi_db;

ALTER TABLE users
ADD COLUMN phone VARCHAR(20) AFTER email;
