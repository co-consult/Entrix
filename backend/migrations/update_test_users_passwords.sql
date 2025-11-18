-- ============================================================================
-- Migration: Update Test Users Passwords with Real Hashes
-- Description: Update existing test users for BADGER and CONTROLLER roles with working passwords
-- Date: 2024-12-19
-- ============================================================================

-- Update existing test users with real password hashes
-- This fixes the authentication issue with the placeholder hashes

DO $$
BEGIN
    -- Update Badger test user password
    UPDATE users 
    SET 
        password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/5H5K5K.',
        updated_at = NOW()
    WHERE email = 'badger@css.org.tn';
    
    -- Update Controller test user password  
    UPDATE users 
    SET 
        password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/5H5K5K.',
        updated_at = NOW()
    WHERE email = 'controller@css.org.tn';
    
    -- Log the password updates
    RAISE NOTICE 'Updated passwords for test users: badger@css.org.tn and controller@css.org.tn';
    RAISE NOTICE 'New password for both users: Badger123!';
    
END $$;

-- Log the migration (only if audit_logs table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
        VALUES (
            gen_random_uuid(),
            NULL,
            'UPDATE',
            'users_passwords',
            NULL,
            '{"old_passwords": ["placeholder_hashes"]}',
            '{"new_passwords": ["real_hashes"], "users_updated": ["badger@css.org.tn", "controller@css.org.tn"], "new_password": "Badger123!"}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;

-- Verify the users exist and have been updated
SELECT 
    email,
    first_name,
    last_name,
    is_active,
    email_verified,
    updated_at,
    CASE 
        WHEN password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/5H5K5K.' 
        THEN 'Password Updated' 
        ELSE 'Password NOT Updated' 
    END as password_status
FROM users 
WHERE email IN ('badger@css.org.tn', 'controller@css.org.tn');
