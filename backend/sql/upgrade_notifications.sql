-- Upgrade Notifications table
ALTER TABLE notifications
ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
ADD COLUMN metadata JSON NULL;

-- New index for unread counts
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
