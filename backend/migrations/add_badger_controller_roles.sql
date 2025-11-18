-- Migration: Add Badger and Controller Roles
-- Description: Add BADGER and CONTROLLER roles for access control personnel
-- Date: 2024-12-19

-- Add BADGER role (Access Control Personnel - Full validation access)
INSERT INTO roles (id, code, name, description, level, is_active, permissions, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'BADGER',
    'Badger',
    'Access control personnel - QR code scanning and validation with access control logging',
    20,
    true,
    '{"access_control": {"scan": true, "validate": true, "view_history": true, "create_logs": true}, "read_only": false}',
    NOW(),
    NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = 'Badger',
    description = 'Access control personnel - QR code scanning and validation with access control logging',
    level = 20,
    permissions = '{"access_control": {"scan": true, "validate": true, "view_history": true, "create_logs": true}, "read_only": false}',
    updated_at = NOW();

-- Add CONTROLLER role (Access Control Personnel - Info only)
INSERT INTO roles (id, code, name, description, level, is_active, permissions, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'CONTROLLER',
    'Controller',
    'Access control personnel - QR code scanning and info checking only (no validation)',
    15,
    true,
    '{"access_control": {"scan": true, "view_history": true, "info_only": true}, "read_only": true}',
    NOW(),
    NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = 'Controller',
    description = 'Access control personnel - QR code scanning and info checking only (no validation)',
    level = 15,
    permissions = '{"access_control": {"scan": true, "view_history": true, "info_only": true}, "read_only": true}',
    updated_at = NOW();

-- Log the migration (only if audit_logs table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
        VALUES (
            gen_random_uuid(),
            NULL,
            'CREATE',
            'roles',
            NULL,
            NULL,
            '{"new_roles_added": ["BADGER", "CONTROLLER"], "badger_level": 20, "controller_level": 15, "badger_permissions": "validation_access", "controller_permissions": "info_only"}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;
