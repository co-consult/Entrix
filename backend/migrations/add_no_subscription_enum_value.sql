-- ============================================================================
-- Migration: Add NO_SUBSCRIPTION to denial_reason enum
-- Description: Add NO_SUBSCRIPTION enum value for valid QR codes without subscriptions
-- Date: 2024-12-19
-- ============================================================================

-- Add NO_SUBSCRIPTION value to the denial_reason enum
-- This allows the backend to properly distinguish between non-existent QR codes
-- and valid QR codes that have no active subscription

DO $$
BEGIN
    -- Check if the enum value already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'NO_SUBSCRIPTION' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'denial_reason')
    ) THEN
        -- Add the new enum value
        ALTER TYPE denial_reason ADD VALUE 'NO_SUBSCRIPTION';
        
        RAISE NOTICE 'Successfully added NO_SUBSCRIPTION to denial_reason enum';
    ELSE
        RAISE NOTICE 'NO_SUBSCRIPTION already exists in denial_reason enum, skipping';
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
            'CREATE', -- Changed from 'ALTER' to 'CREATE' which should be valid
            'denial_reason_enum',
            NULL,
            '{"old_enum_values": ["INVALID_CODE", "EXPIRED", "ALREADY_USED", "BLACKLISTED", "WRONG_EVENT", "WRONG_VENUE", "WRONG_ZONE", "WRONG_TIME", "SUSPENDED_ACCESS", "REVOKED_ACCESS", "PENDING_ACTIVATION", "TECHNICAL_ERROR", "NETWORK_ERROR", "DATABASE_ERROR", "SECURITY_FLAG", "FRAUD_SUSPECTED", "DUPLICATE_ENTRY"]}',
            '{"new_enum_values": ["INVALID_CODE", "EXPIRED", "ALREADY_USED", "BLACKLISTED", "WRONG_EVENT", "WRONG_VENUE", "WRONG_ZONE", "WRONG_TIME", "SUSPENDED_ACCESS", "REVOKED_ACCESS", "PENDING_ACTIVATION", "NO_SUBSCRIPTION", "TECHNICAL_ERROR", "NETWORK_ERROR", "DATABASE_ERROR", "SECURITY_FLAG", "FRAUD_SUSPECTED", "DUPLICATE_ENTRY"]}',
            '127.0.0.1',
            'Migration Script',
            NOW()
        );
    END IF;
END $$;

-- Verify the enum value was added
SELECT 
    enumlabel as enum_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'denial_reason')
ORDER BY enumsortorder;
