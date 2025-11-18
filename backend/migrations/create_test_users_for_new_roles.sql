-- Migration: Create Test Users for New Roles
-- Description: Create test users for BADGER and CONTROLLER roles for testing
-- Date: 2024-12-19

-- Create test users for the new roles
DO $$
DECLARE
    badger_role_id UUID;
    controller_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO badger_role_id FROM roles WHERE code = 'BADGER';
    SELECT id INTO controller_role_id FROM roles WHERE code = 'CONTROLLER';
    
    -- Create Badger test user
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'badger@css.org.tn',
        'Badger',
        'Test',
        '$2b$12$TestBadgerPasswordHashHere', -- Password: Badger123!
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Create Controller test user
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'controller@css.org.tn',
        'Controller',
        'Test',
        '$2b$12$TestControllerPasswordHashHere', -- Password: Controller123!
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Assign Badger role to Badger user
    IF badger_role_id IS NOT NULL THEN
        INSERT INTO user_roles (id, user_id, role_id, assigned_at, status, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            u.id,
            badger_role_id,
            NOW(),
            'ACTIVE',
            NOW(),
            NOW()
        FROM users u
        WHERE u.email = 'badger@css.org.tn'
        AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = u.id AND ur.role_id = badger_role_id
        );
    END IF;
    
    -- Assign Controller role to Controller user
    IF controller_role_id IS NOT NULL THEN
        INSERT INTO user_roles (id, user_id, role_id, assigned_at, status, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            u.id,
            controller_role_id,
            NOW(),
            'ACTIVE',
            NOW(),
            NOW()
        FROM users u
        WHERE u.email = 'controller@css.org.tn'
        AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = u.id AND ur.role_id = controller_role_id
        );
    END IF;
    
    RAISE NOTICE 'Test users created for BADGER and CONTROLLER roles';
END $$;

-- Log the migration (only if audit_logs table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
        VALUES (
            gen_random_uuid(),
            NULL,
            'CREATE',
            'users,user_roles',
            NULL,
            NULL,
            '{"test_users_created": ["badger@css.org.tn", "controller@css.org.tn"], "roles_assigned": ["BADGER", "CONTROLLER"]}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;
