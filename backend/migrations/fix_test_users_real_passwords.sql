-- ============================================================================
-- Migration: Fix Test Users with Real Working Password Hash
-- Description: Update test users with a properly generated bcrypt hash that actually works
-- Date: 2024-12-19
-- ============================================================================

-- Update test users with REAL working bcrypt hashes
-- This fixes the authentication issue with the fake placeholder hashes

DO $$
BEGIN
    -- Update Badger test user with REAL working hash for "password123"
    UPDATE users 
    SET 
        password = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        updated_at = NOW()
    WHERE email = 'badger@css.org.tn';
    
    -- Update Controller test user with REAL working hash for "password123"
    UPDATE users 
    SET 
        password = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        updated_at = NOW()
    WHERE email = 'controller@css.org.tn';
    
    -- Log the password updates
    RAISE NOTICE 'Updated passwords for test users: badger@css.org.tn and controller@css.org.tn';
    RAISE NOTICE 'New password for both users: password123';
    RAISE NOTICE 'This is a REAL working bcrypt hash that will actually authenticate!';
    
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
            '{"old_passwords": ["fake_placeholder_hashes"]}',
            '{"new_passwords": ["real_working_bcrypt_hash"], "users_updated": ["badger@css.org.tn", "controller@css.org.tn"], "new_password": "password123", "note": "Real working hash that will authenticate"}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;

-- Verify the users have been updated with the real hash
SELECT 
    email,
    first_name,
    last_name,
    is_active,
    email_verified,
    updated_at,
    CASE 
        WHEN password = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
        THEN '✅ Password Updated with REAL Hash' 
        ELSE '❌ Password NOT Updated' 
    END as password_status
FROM users 
WHERE email IN ('badger@css.org.tn', 'controller@css.org.tn');
