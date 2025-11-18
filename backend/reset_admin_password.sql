-- Reset Admin Password to: admin123
UPDATE users 
SET password = '$2b$10$mf.TfoSG2C9GwpHnJoaMxuLBqs17ROQwinKTXS1v1GwCdi8vJvsIG'
WHERE email = 'admin@entrix.dev';

-- Verify
SELECT email, first_name, last_name, is_active, email_verified IS NOT NULL as email_verified
FROM users 
WHERE email = 'admin@entrix.dev';

