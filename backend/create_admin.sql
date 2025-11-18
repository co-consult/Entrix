-- Create Admin User
DO $$
DECLARE 
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
    
    -- Create admin user
    INSERT INTO users (id, email, first_name, last_name, password, is_active, email_verified, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'admin@entrix.dev',
        'Admin',
        'User',
        '$2b$10$RC/LufGupwJ20CzgF3Ls9eVE4gM19IsVLGsJTcx4qKQPhNF0.zUDC',
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE 
    SET password = EXCLUDED.password,
        is_active = true,
        email_verified = NOW()
    RETURNING id INTO admin_user_id;
    
    -- Assign ADMIN role
    INSERT INTO user_roles (id, user_id, role_id, assigned_at, status, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        admin_user_id,
        admin_role_id,
        NOW(),
        'ACTIVE',
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin user created: %', admin_user_id;
END $$;

-- Verify admin user
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    r.code as role_code,
    r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.code = 'ADMIN';

