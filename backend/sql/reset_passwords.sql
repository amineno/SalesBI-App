USE salesbi_db;
UPDATE users 
SET password = '$2b$12$Jxy435oQDaIJNX.l.btFduRW4.DCOzAyLed5q5JedE2G11mscgleG', 
    failed_login_attempts = 0, 
    locked_until = NULL;
