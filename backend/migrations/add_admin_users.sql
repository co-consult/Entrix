-- Migration: Add Admin Users
-- Description: Add 5 admin users with strong passwords and admin role (level 90)
-- Date: 2024-12-19

-- First, ensure the admin role exists with level 90
INSERT INTO roles (id, code, name, description, level, is_active, permissions, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'ADMIN',
    'Administrator',
    'Full system administrator with all permissions',
    90,
    true,
    '{"all": true}',
    NOW(),
    NOW()
)
ON CONFLICT (code) DO UPDATE SET
    level = 90,
    name = 'Administrator',
    description = 'Full system administrator with all permissions',
    permissions = '{"all": true}',
    updated_at = NOW();

-- Get the admin role ID
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE code = 'ADMIN';
    
    -- Add Hanen Mnif
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'direction.socioscss@gmail.com',
        'Hanen',
        'Mnif',
        '$2b$12$Ed3gT2rTY9.58/7EhpHXw.RAg5sF.buymlzVeNdMOTYKbE3GLHqQi', -- Strong password: H@nen2024!Mnif
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Add Abdallah Bahri
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'abdoubahri03@gmail.com',
        'Abdallah',
        'Bahri',
        '$2b$12$BM5i67xxCKpU8AKysVHfpO2p8vyIvVN29zPqiSj6L/dbQz6.EJJD.', -- Strong password: Abd@llah2024!B
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Add Alaa Keskes
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'commercial.socios@gmail.com',
        'Alaa',
        'Keskes',
        '$2b$12$yyJpPlkg6YumDHep/NFHGugMTf85bnm.3JFMaLOqfhOAQDdA2HPcm', -- Strong password: Al@a2024!Keskes
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Add Wissem Ali
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'assistant.sg@css.org.tn',
        'Wissem',
        'Ali',
        '$2b$12$H2srGXLXmf.MMF6naHXAmes7eoNbogfNvudlFtG6MjUyxcFrKWEee', -- Strong password: Wissem@2024!Ali
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Add Imen Karra
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'bureau.tunis@socios-css.org',
        'Imen',
        'Karra',
        '$2b$12$SehRNXx.Ns.lPMVreP7uBeL11hLCsOwgxM8o0hklR.746bQ/h6zMS', -- Strong password: Imen@2024!K@rra
        true,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Assign admin role to all users
    INSERT INTO user_roles (id, user_id, role_id, assigned_at, status, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        u.id,
        admin_role_id,
        NOW(),
        'ACTIVE',
        NOW(),
        NOW()
    FROM users u
    WHERE u.email IN (
        'direction.socioscss@gmail.com',
        'abdoubahri03@gmail.com',
        'commercial.socios@gmail.com',
        'assistant.sg@css.org.tn',
        'bureau.tunis@socios-css.org'
    )
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = u.id AND ur.role_id = admin_role_id
    );
    
END $$;

-- Log the migration
INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
VALUES (
    gen_random_uuid(),
    NULL,
    'CREATE',
    'users,user_roles',
    NULL,
    NULL,
    '{"admin_users_added": 5, "admin_role_level": 90}',
    '127.0.0.1',
    'Migration Script',
    NOW()
); 