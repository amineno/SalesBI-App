-- Enterprise Settings Table
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NULL,
    category VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Initial Settings
INSERT IGNORE INTO settings (setting_key, setting_value, category) VALUES
('company_name', 'SalesBI Enterprise', 'branding'),
('company_logo', '/uploads/logo.png', 'branding'),
('primary_color', '#4f46e5', 'branding'),
('currency', 'USD', 'localization'),
('email_notifications', 'true', 'system'),
('maintenance_mode', 'false', 'system');
