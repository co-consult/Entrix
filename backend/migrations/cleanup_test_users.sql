-- ============================================================================
-- Migration: Cleanup Test Users and Related Data
-- Description: Remove test users for BADGER and CONTROLLER roles and clean up user_roles
-- Date: 2024-12-19
-- ============================================================================

-- Clean up test users and their role assignments
-- This allows us to start fresh with a different approach
-- NOTE: BADGER and CONTROLLER roles are kept intact

DO $$
DECLARE
    badger_user_id UUID;
    controller_user_id UUID;
    badger_role_id UUID;
    controller_role_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO badger_user_id FROM users WHERE email = 'badger@css.org.tn';
    SELECT id INTO controller_user_id FROM users WHERE email = 'controller@css.org.tn';
    
    -- Get role IDs
    SELECT id INTO badger_role_id FROM roles WHERE code = 'BADGER';
    SELECT id INTO controller_role_id FROM roles WHERE code = 'CONTROLLER';
    
    -- Remove role assignments from user_roles table
    IF badger_user_id IS NOT NULL AND badger_role_id IS NOT NULL THEN
        DELETE FROM user_roles WHERE user_id = badger_user_id AND role_id = badger_role_id;
        RAISE NOTICE 'Removed BADGER role assignment for badger@css.org.tn';
    END IF;
    
    IF controller_user_id IS NOT NULL AND controller_role_id IS NOT NULL THEN
        DELETE FROM user_roles WHERE user_id = controller_user_id AND role_id = controller_role_id;
        RAISE NOTICE 'Removed CONTROLLER role assignment for controller@css.org.tn';
    END IF;
    
    -- Delete the test users
    IF badger_user_id IS NOT NULL THEN
        DELETE FROM users WHERE id = badger_user_id;
        RAISE NOTICE 'Deleted test user: badger@css.org.tn';
    END IF;
    
    IF controller_user_id IS NOT NULL THEN
        DELETE FROM users WHERE id = controller_user_id;
        RAISE NOTICE 'Deleted test user: controller@css.org.tn';
    END IF;
    
    RAISE NOTICE 'Cleanup completed successfully - BADGER and CONTROLLER roles are kept intact';
    
END $$;

-- Log the cleanup (only if audit_logs table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
        VALUES (
            gen_random_uuid(),
            NULL,
            'DELETE',
            'test_users_cleanup',
            NULL,
            '{"deleted_users": ["badger@css.org.tn", "controller@css.org.tn"], "deleted_role_assignments": ["BADGER", "CONTROLLER"]}',
            '{"cleanup_status": "completed", "note": "Test users and role assignments removed, but BADGER and CONTROLLER roles kept intact"}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;

-- Verify cleanup was successful
SELECT 
    'Users remaining' as check_type,
    COUNT(*) as count
FROM users 
WHERE email IN ('badger@css.org.tn', 'controller@css.org.tn')

UNION ALL

SELECT 
    'User roles remaining' as check_type,
    COUNT(*) as count
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.email IN ('badger@css.org.tn', 'controller@css.org.tn')

UNION ALL

SELECT 
    'BADGER and CONTROLLER roles exist' as check_type,
    COUNT(*) as count
FROM roles 
WHERE code IN ('BADGER', 'CONTROLLER');
