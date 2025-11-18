-- Update admin password to Admin123!
UPDATE users 
SET password = '$2b$12$f4rh4SD9AdOFiMochaLL..ln2mxTTyDB6fVOeRqbcE3oHd67n/C0W'
WHERE email = 'admin@entrx.local';

-- Verify
SELECT email, LEFT(password, 40) as password_hash_preview
FROM users 
WHERE email = 'admin@entrx.local';

