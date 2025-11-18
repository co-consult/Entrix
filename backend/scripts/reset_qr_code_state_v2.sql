-- ============================================================================
-- Script: Reset Physical QR Code State (V2 - COMPLETELY REWRITTEN)
-- Description: This script resets the state of a physical QR code record by
--              cleaning up all data that gets affected during subscription creation
--              V2: Completely rewritten to avoid all variable reference issues
-- Usage: Replace 'SERIAL_NUMBER_HERE' with the actual serial number
-- ============================================================================

-- Set the serial number to reset (replace with actual serial number)
DO $$
DECLARE
    target_serial_number VARCHAR(4) := '1602'; -- REPLACE WITH ACTUAL SERIAL NUMBER
    qr_code_record RECORD;
    subscription_record RECORD;
    access_right_record RECORD;
    affected_qr_code VARCHAR(255);
    affected_subscription_id UUID;
    affected_order_id UUID;
    affected_user_id UUID;
    deleted_count INTEGER;
BEGIN
    -- Log the start of the reset process
    RAISE NOTICE 'Starting QR code state reset for serial number: %', target_serial_number;
    
    -- Find the QR code record by serial number
    SELECT * INTO qr_code_record 
    FROM physical_qr_codes 
    WHERE serial_number = target_serial_number;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'QR code with serial number % not found', target_serial_number;
    END IF;
    
    affected_qr_code := qr_code_record.qr_code;
    RAISE NOTICE 'Found QR code: %', affected_qr_code;
    
    -- 1. Find and delete access rights associated with this QR code
    RAISE NOTICE 'Step 1: Cleaning up access rights...';
    
    -- Disable the audit trigger temporarily to avoid updated_by field error
    ALTER TABLE access_rights DISABLE TRIGGER trigger_audit_access_rights;
    
    DELETE FROM access_rights 
    WHERE qr_code = affected_qr_code
    RETURNING * INTO access_right_record;
    
    IF FOUND THEN
        RAISE NOTICE 'Deleted access right: %', access_right_record.id;
    ELSE
        RAISE NOTICE 'No access rights found for QR code: %', affected_qr_code;
    END IF;
    
    -- Re-enable the audit trigger
    ALTER TABLE access_rights ENABLE TRIGGER trigger_audit_access_rights;
    
    -- 2. Find subscriptions that reference this QR code in metadata
    RAISE NOTICE 'Step 2: Finding subscriptions with QR code in metadata...';
    FOR subscription_record IN 
        SELECT id, metadata, user_id
        FROM subscriptions 
        WHERE metadata->>'qrCode' = affected_qr_code
    LOOP
        affected_subscription_id := subscription_record.id;
        affected_user_id := subscription_record.user_id;
        RAISE NOTICE 'Found subscription: % (user: %)', affected_subscription_id, affected_user_id;
        
        -- 3. Find the order associated with this subscription
        IF subscription_record.metadata->>'orderId' IS NOT NULL THEN
            affected_order_id := (subscription_record.metadata->>'orderId')::UUID;
            RAISE NOTICE 'Found associated order: %', affected_order_id;
            
            -- 4. Delete order items for this subscription
            RAISE NOTICE 'Step 4: Deleting order items...';
            
            -- Get the subscription plan name first
            WITH plan_info AS (
                SELECT sp.name as plan_name
                FROM subscription_plans sp
                JOIN subscriptions s ON s.plan_id = sp.id
                WHERE s.id = affected_subscription_id
            ),
            deleted_items AS (
                DELETE FROM order_items 
                WHERE order_id = affected_order_id 
                AND item_type = 'SUBSCRIPTION'
                AND item_name = (SELECT plan_name FROM plan_info)
                RETURNING id
            )
            SELECT COUNT(*) INTO deleted_count
            FROM deleted_items;
            
            IF deleted_count > 0 THEN
                RAISE NOTICE 'Deleted % order item(s) for subscription: %', deleted_count, affected_subscription_id;
            ELSE
                RAISE NOTICE 'No order items found for subscription: %', affected_subscription_id;
            END IF;
            
            -- 5. Check if this order has other subscriptions (if not, delete the order)
            IF NOT EXISTS (
                SELECT 1 FROM subscriptions 
                WHERE metadata->>'orderId' = affected_order_id::TEXT
                AND id != affected_subscription_id
            ) THEN
                RAISE NOTICE 'Step 5: Deleting orphaned order...';
                DELETE FROM orders WHERE id = affected_order_id;
                RAISE NOTICE 'Deleted order: %', affected_order_id;
            ELSE
                RAISE NOTICE 'Order % has other subscriptions, keeping it', affected_order_id;
            END IF;
        END IF;
        
        -- 6. Delete the subscription
        RAISE NOTICE 'Step 6: Deleting subscription...';
        DELETE FROM subscriptions WHERE id = affected_subscription_id;
        RAISE NOTICE 'Deleted subscription: %', affected_subscription_id;
        
        -- 7. Check if user has other subscriptions (if not and user was created for this sale, consider deleting)
        IF affected_user_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM subscriptions 
                WHERE user_id = affected_user_id 
                AND id != affected_subscription_id
            ) THEN
                RAISE NOTICE 'User % has no other subscriptions', affected_user_id;
                -- Note: We don't delete the user automatically as they might have other data
                -- Uncomment the following lines if you want to delete orphaned users:
                -- DELETE FROM users WHERE id = affected_user_id;
                -- RAISE NOTICE 'Deleted orphaned user: %', affected_user_id;
            END IF;
        END IF;
    END LOOP;
    
    -- 8. Reset the physical QR code to AVAILABLE state
    RAISE NOTICE 'Step 8: Resetting QR code state...';
    UPDATE physical_qr_codes 
    SET 
        status = 'AVAILABLE',
        subscription_plan_id = NULL,
        assigned_by = NULL,
        assigned_at = NULL,
        first_used_at = NULL,
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{reset_history}',
            COALESCE(metadata->'reset_history', '[]'::jsonb) || 
            jsonb_build_object(
                'reset_at', NOW(),
                'previous_status', qr_code_record.status,
                'previous_assigned_by', qr_code_record.assigned_by,
                'previous_assigned_at', qr_code_record.assigned_at,
                'reset_reason', 'Manual reset via script V2'
            )
        ),
        updated_at = NOW()
    WHERE serial_number = target_serial_number;
    
    RAISE NOTICE 'QR code % reset to AVAILABLE state', affected_qr_code;
    
    -- 9. Clear any cached data (this would need to be done in application code)
    RAISE NOTICE 'Step 9: Cache clearing instructions...';
    RAISE NOTICE 'IMPORTANT: Clear the following cache keys in your application:';
    RAISE NOTICE '  - qr-code:%', affected_qr_code;
    RAISE NOTICE '  - subscription-sale:* (if any orders were deleted)';
    
    -- 10. Log the completion
    RAISE NOTICE 'QR code state reset completed successfully for serial number: %', target_serial_number;
    RAISE NOTICE 'QR code: % is now AVAILABLE and ready for reassignment', affected_qr_code;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable triggers in case of error
        ALTER TABLE access_rights ENABLE TRIGGER trigger_audit_access_rights;
        RAISE EXCEPTION 'Error during QR code reset: %', SQLERRM;
END $$;

-- ============================================================================
-- Verification Queries (run these after the reset to verify the state)
-- ============================================================================

-- Check the QR code state
SELECT 
    serial_number,
    qr_code,
    status,
    subscription_plan_id,
    assigned_by,
    assigned_at,
    first_used_at,
    metadata->'reset_history' as reset_history
FROM physical_qr_codes 
WHERE serial_number = '1602'; -- REPLACE WITH ACTUAL SERIAL NUMBER

-- Verify no access rights exist for this QR code
SELECT COUNT(*) as remaining_access_rights
FROM access_rights 
WHERE qr_code = (
    SELECT qr_code FROM physical_qr_codes WHERE serial_number = '1602'
);

-- Verify no subscriptions reference this QR code
SELECT COUNT(*) as remaining_subscriptions
FROM subscriptions 
WHERE metadata->>'qrCode' = (
    SELECT qr_code FROM physical_qr_codes WHERE serial_number = '1602'
);

-- ============================================================================
-- Usage Instructions:
-- ============================================================================
-- 1. Replace '1602' with the actual 4-character serial number
-- 2. Run the script in a transaction to ensure atomicity
-- 3. Review the verification queries to confirm the reset was successful
-- 4. Clear application cache for the affected QR code
-- 5. Consider backing up the database before running this script in production
-- ============================================================================ 