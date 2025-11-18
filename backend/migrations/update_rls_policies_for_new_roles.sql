-- Migration: Update RLS Policies for New Roles
-- Description: Update access control RLS policies to include BADGER and CONTROLLER roles
-- Date: 2024-12-19

-- Check if the access_rights table exists and has RLS enabled
DO $$
BEGIN
    -- Only proceed if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_rights') THEN
        
        -- Drop existing access control policy if it exists
        DROP POLICY IF EXISTS access_rights_validation_read ON access_rights;
        
        -- Recreate access control policy with new roles
        -- Using current_user_id() function as defined in the system
        CREATE POLICY access_rights_validation_read ON access_rights
        FOR SELECT TO public
        USING (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = current_user_id()
                AND r.code IN ('ACCESS_CONTROLLER', 'SECURITY_STAFF', 'BADGER', 'CONTROLLER')
                AND ur.status = 'ACTIVE'
            )
        );
        
        RAISE NOTICE 'Successfully updated access_rights_validation_read policy with new roles';
        
    ELSE
        RAISE NOTICE 'access_rights table does not exist, skipping policy update';
    END IF;
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
            'access_rights_policy',
            NULL,
            '{"old_roles": ["ACCESS_CONTROLLER", "SECURITY_STAFF"]}',
            '{"new_roles": ["ACCESS_CONTROLLER", "SECURITY_STAFF", "BADGER", "CONTROLLER"]}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;
