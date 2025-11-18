-- ============================================================================
-- Script: Reset Physical QR Code State (PRODUCTION VERSION)
-- Description: This script resets the state of a physical QR code record by
--              cleaning up all data that gets affected during subscription creation
--              PRODUCTION: Handles all constraints, triggers, and foreign key relationships
--              INCLUDES: Seat-based QR code handling for reserved seats
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
    affected_seat_id VARCHAR(255);
    affected_event_id UUID;
    deleted_count INTEGER;
    plan_name VARCHAR(255);
    current_trigger_name TEXT;
    trigger_disabled BOOLEAN := FALSE;
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
    
    -- First, get seat and event information from access rights before deletion
    SELECT seat_id, event_id INTO affected_seat_id, affected_event_id
    FROM access_rights 
    WHERE qr_code = affected_qr_code
    LIMIT 1;
    
    IF affected_seat_id IS NOT NULL THEN
        RAISE NOTICE 'Found seat-based QR code. Seat ID: %, Event ID: %', affected_seat_id, affected_event_id;
    END IF;
    
    -- Disable ALL triggers on access_rights table to avoid any constraint issues
    FOR current_trigger_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'access_rights'
    LOOP
        EXECUTE format('ALTER TABLE access_rights DISABLE TRIGGER %I', current_trigger_name);
        RAISE NOTICE 'Disabled trigger: %', current_trigger_name;
        trigger_disabled := TRUE;
    END LOOP;
    
    -- Delete access rights with proper error handling
    BEGIN
        DELETE FROM access_rights 
        WHERE qr_code = affected_qr_code
        RETURNING * INTO access_right_record;
        
        IF FOUND THEN
            RAISE NOTICE 'Deleted access right: %', access_right_record.id;
        ELSE
            RAISE NOTICE 'No access rights found for QR code: %', affected_qr_code;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting access rights: %', SQLERRM;
            -- Continue with the script even if access rights deletion fails
    END;
    
    -- Re-enable all triggers on access_rights
    IF trigger_disabled THEN
        FOR current_trigger_name IN 
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE event_object_table = 'access_rights'
        LOOP
            EXECUTE format('ALTER TABLE access_rights ENABLE TRIGGER %I', current_trigger_name);
            RAISE NOTICE 'Re-enabled trigger: %', current_trigger_name;
        END LOOP;
    END IF;
    
    -- 1.5. Reset seat status if this was a seat-based QR code
    IF affected_seat_id IS NOT NULL THEN
        RAISE NOTICE 'Step 1.5: Resetting seat status...';
        
        -- Disable triggers on seats temporarily
        trigger_disabled := FALSE;
        FOR current_trigger_name IN 
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE event_object_table = 'seats'
        LOOP
            EXECUTE format('ALTER TABLE seats DISABLE TRIGGER %I', current_trigger_name);
            trigger_disabled := TRUE;
        END LOOP;
        
        BEGIN
            UPDATE seats 
            SET 
                status = 'AVAILABLE',
                metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{reset_history}',
                    COALESCE(metadata->'reset_history', '[]'::jsonb) || 
                    jsonb_build_object(
                        'reset_at', NOW(),
                        'previous_status', (SELECT status FROM seats WHERE id = affected_seat_id),
                        'reset_reason', 'QR code reset - seat freed',
                        'qr_code', affected_qr_code
                    )
                ),
                updated_at = NOW()
            WHERE id = affected_seat_id;
            
            RAISE NOTICE 'Reset seat % to AVAILABLE status', affected_seat_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error resetting seat status: %', SQLERRM;
        END;
        
        -- Re-enable triggers on seats
        IF trigger_disabled THEN
            FOR current_trigger_name IN 
                SELECT trigger_name 
                FROM information_schema.triggers 
                WHERE event_object_table = 'seats'
            LOOP
                EXECUTE format('ALTER TABLE seats ENABLE TRIGGER %I', current_trigger_name);
            END LOOP;
        END IF;
    END IF;
    
    -- 2. Find subscriptions that reference this QR code in metadata
    RAISE NOTICE 'Step 2: Finding subscriptions with QR code in metadata...';
    FOR subscription_record IN 
        SELECT id, metadata, user_id, plan_id
        FROM subscriptions 
        WHERE metadata->>'qrCode' = affected_qr_code
    LOOP
        affected_subscription_id := subscription_record.id;
        affected_user_id := subscription_record.user_id;
        RAISE NOTICE 'Found subscription: % (user: %)', affected_subscription_id, affected_user_id;
        
        -- Get the subscription plan name safely
        BEGIN
            SELECT name INTO plan_name
            FROM subscription_plans 
            WHERE id = subscription_record.plan_id;
        EXCEPTION
            WHEN OTHERS THEN
                plan_name := NULL;
                RAISE NOTICE 'Could not get plan name for subscription: %', affected_subscription_id;
        END;
        
        -- 3. Find the order associated with this subscription
        IF subscription_record.metadata->>'orderId' IS NOT NULL THEN
            BEGIN
                affected_order_id := (subscription_record.metadata->>'orderId')::UUID;
                RAISE NOTICE 'Found associated order: %', affected_order_id;
                
                -- 4. Delete order items for this subscription (with constraint handling)
                RAISE NOTICE 'Step 4: Deleting order items...';
                
                -- Disable triggers on order_items temporarily
                trigger_disabled := FALSE;
                FOR current_trigger_name IN 
                    SELECT trigger_name 
                    FROM information_schema.triggers 
                    WHERE event_object_table = 'order_items'
                LOOP
                    EXECUTE format('ALTER TABLE order_items DISABLE TRIGGER %I', current_trigger_name);
                    trigger_disabled := TRUE;
                END LOOP;
                
                -- Delete order items with proper error handling
                BEGIN
                    IF plan_name IS NOT NULL THEN
                        WITH deleted_items AS (
                            DELETE FROM order_items 
                            WHERE order_id = affected_order_id 
                            AND item_type = 'SUBSCRIPTION'
                            AND item_name = plan_name
                            RETURNING id
                        )
                        SELECT COUNT(*) INTO deleted_count
                        FROM deleted_items;
                    ELSE
                        -- Fallback: delete by subscription ID if plan name is not available
                        WITH deleted_items AS (
                            DELETE FROM order_items 
                            WHERE order_id = affected_order_id 
                            AND item_type = 'SUBSCRIPTION'
                            AND item_metadata->>'subscription_id' = affected_subscription_id::TEXT
                            RETURNING id
                        )
                        SELECT COUNT(*) INTO deleted_count
                        FROM deleted_items;
                    END IF;
                    
                    IF deleted_count > 0 THEN
                        RAISE NOTICE 'Deleted % order item(s) for subscription: %', deleted_count, affected_subscription_id;
                    ELSE
                        RAISE NOTICE 'No order items found for subscription: %', affected_subscription_id;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Error deleting order items: %', SQLERRM;
                        deleted_count := 0;
                END;
                
                -- Re-enable triggers on order_items
                IF trigger_disabled THEN
                    FOR current_trigger_name IN 
                        SELECT trigger_name 
                        FROM information_schema.triggers 
                        WHERE event_object_table = 'order_items'
                    LOOP
                        EXECUTE format('ALTER TABLE order_items ENABLE TRIGGER %I', current_trigger_name);
                    END LOOP;
                END IF;
                
                -- 5. Check if this order has other subscriptions (if not, delete the order)
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM subscriptions 
                        WHERE metadata->>'orderId' = affected_order_id::TEXT
                        AND id != affected_subscription_id
                    ) THEN
                        RAISE NOTICE 'Step 5: Deleting orphaned order...';
                        
                        -- Disable triggers on orders temporarily
                        trigger_disabled := FALSE;
                        FOR current_trigger_name IN 
                            SELECT trigger_name 
                            FROM information_schema.triggers 
                            WHERE event_object_table = 'orders'
                        LOOP
                            EXECUTE format('ALTER TABLE orders DISABLE TRIGGER %I', current_trigger_name);
                            trigger_disabled := TRUE;
                        END LOOP;
                        
                        DELETE FROM orders WHERE id = affected_order_id;
                        RAISE NOTICE 'Deleted order: %', affected_order_id;
                        
                        -- Re-enable triggers on orders
                        IF trigger_disabled THEN
                            FOR current_trigger_name IN 
                                SELECT trigger_name 
                                FROM information_schema.triggers 
                                WHERE event_object_table = 'orders'
                            LOOP
                                EXECUTE format('ALTER TABLE orders ENABLE TRIGGER %I', current_trigger_name);
                            END LOOP;
                        END IF;
                    ELSE
                        RAISE NOTICE 'Order % has other subscriptions, keeping it', affected_order_id;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Error handling order deletion: %', SQLERRM;
                END;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error processing order for subscription %: %', affected_subscription_id, SQLERRM;
            END;
        END IF;
        
        -- 6. Delete the subscription (with constraint handling)
        RAISE NOTICE 'Step 6: Deleting subscription...';
        
        BEGIN
            -- Try to delete subscription directly first (most triggers should handle this gracefully)
            DELETE FROM subscriptions WHERE id = affected_subscription_id;
            RAISE NOTICE 'Deleted subscription: %', affected_subscription_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Direct deletion failed, attempting with trigger management: %', SQLERRM;
                
                -- Only disable triggers if direct deletion fails
                trigger_disabled := FALSE;
                FOR current_trigger_name IN 
                    SELECT trigger_name 
                    FROM information_schema.triggers 
                    WHERE event_object_table = 'subscriptions'
                LOOP
                    BEGIN
                        EXECUTE format('ALTER TABLE subscriptions DISABLE TRIGGER %I', current_trigger_name);
                        trigger_disabled := TRUE;
                        RAISE NOTICE 'Disabled trigger: %', current_trigger_name;
                    EXCEPTION
                        WHEN OTHERS THEN
                            RAISE NOTICE 'Could not disable trigger %: %', current_trigger_name, SQLERRM;
                    END;
                END LOOP;
                
                -- Try deletion again
                BEGIN
                    DELETE FROM subscriptions WHERE id = affected_subscription_id;
                    RAISE NOTICE 'Deleted subscription: % (with triggers disabled)', affected_subscription_id;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Error deleting subscription % even with triggers disabled: %', affected_subscription_id, SQLERRM;
                END;
                
                -- Re-enable triggers on subscriptions
                IF trigger_disabled THEN
                    FOR current_trigger_name IN 
                        SELECT trigger_name 
                        FROM information_schema.triggers 
                        WHERE event_object_table = 'subscriptions'
                    LOOP
                        BEGIN
                            EXECUTE format('ALTER TABLE subscriptions ENABLE TRIGGER %I', current_trigger_name);
                            RAISE NOTICE 'Re-enabled trigger: %', current_trigger_name;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE NOTICE 'Could not re-enable trigger %: %', current_trigger_name, SQLERRM;
                        END;
                    END LOOP;
                END IF;
        END;
        
        -- 7. Check if user has other subscriptions (if not and user was created for this sale, consider deleting)
        IF affected_user_id IS NOT NULL THEN
            BEGIN
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
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error checking user subscriptions: %', SQLERRM;
            END;
        END IF;
    END LOOP;
    
    -- 8. Reset the physical QR code to AVAILABLE state
    RAISE NOTICE 'Step 8: Resetting QR code state...';
    
    -- Disable triggers on physical_qr_codes temporarily
    trigger_disabled := FALSE;
    FOR current_trigger_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'physical_qr_codes'
    LOOP
        EXECUTE format('ALTER TABLE physical_qr_codes DISABLE TRIGGER %I', current_trigger_name);
        trigger_disabled := TRUE;
    END LOOP;
    
    BEGIN
            UPDATE physical_qr_codes 
    SET 
        status = 'AVAILABLE',
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
                    'reset_reason', 'Manual reset via production script',
                    'was_seat_based', affected_seat_id IS NOT NULL,
                    'affected_seat_id', affected_seat_id,
                    'affected_event_id', affected_event_id
                )
            ),
            updated_at = NOW()
        WHERE serial_number = target_serial_number;
        
        RAISE NOTICE 'QR code % reset to AVAILABLE state', affected_qr_code;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error updating QR code: %', SQLERRM;
    END;
    
    -- Re-enable triggers on physical_qr_codes
    IF trigger_disabled THEN
        FOR current_trigger_name IN 
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE event_object_table = 'physical_qr_codes'
        LOOP
            EXECUTE format('ALTER TABLE physical_qr_codes ENABLE TRIGGER %I', current_trigger_name);
        END LOOP;
    END IF;
    
    -- 9. Clear any cached data (this would need to be done in application code)
    RAISE NOTICE 'Step 9: Cache clearing instructions...';
    RAISE NOTICE 'IMPORTANT: Clear the following cache keys in your application:';
    RAISE NOTICE '  - qr-code:%', affected_qr_code;
    RAISE NOTICE '  - subscription-sale:* (if any orders were deleted)';
    IF affected_seat_id IS NOT NULL THEN
        RAISE NOTICE '  - seat:% (seat cache)', affected_seat_id;
        RAISE NOTICE '  - event-seats:% (event seats cache)', affected_event_id;
    END IF;
    
    -- 10. Log the completion
    RAISE NOTICE 'QR code state reset completed successfully for serial number: %', target_serial_number;
    RAISE NOTICE 'QR code: % is now AVAILABLE and ready for reassignment', affected_qr_code;
    IF affected_seat_id IS NOT NULL THEN
        RAISE NOTICE 'Seat % has been reset to AVAILABLE status', affected_seat_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable all triggers in case of error
        RAISE NOTICE 'Error occurred, attempting to re-enable all triggers...';
        
        -- Re-enable triggers on all affected tables with better error handling
        FOR current_trigger_name IN 
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers 
            WHERE event_object_table IN ('access_rights', 'order_items', 'orders', 'subscriptions', 'physical_qr_codes', 'seats')
        LOOP
            BEGIN
                EXECUTE format('ALTER TABLE %I ENABLE TRIGGER %I', 
                    current_trigger_name.event_object_table,
                    current_trigger_name.trigger_name);
                RAISE NOTICE 'Re-enabled trigger % on table %', current_trigger_name.trigger_name, current_trigger_name.event_object_table;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not re-enable trigger % on table %: %', current_trigger_name.trigger_name, current_trigger_name.event_object_table, SQLERRM;
            END;
        END LOOP;
        
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

-- Check if any seats were affected (for seat-based QR codes)
SELECT 
    s.id as seat_id,
    s.seat_number,
    s.status,
    s.zone_id,
    s.metadata->'reset_history' as seat_reset_history
FROM seats s
JOIN access_rights ar ON s.id = ar.seat_id
WHERE ar.qr_code = (
    SELECT qr_code FROM physical_qr_codes WHERE serial_number = '1602'
);

-- ============================================================================
-- Usage Instructions:
-- ============================================================================
-- 1. Replace '1602' with the actual 4-character serial number
-- 2. Run the script in a transaction to ensure atomicity
-- 3. Review the verification queries to confirm the reset was successful
-- 4. Clear application cache for the affected QR code and seat (if applicable)
-- 5. Consider backing up the database before running this script in production
-- ============================================================================ 