-- ============================================================================
-- Script: Reset Multiple Physical QR Codes State
-- Description: This script resets the state of multiple physical QR code records
--              by cleaning up all data that gets affected during subscription creation
-- Usage: Replace the serial numbers array with actual serial numbers
-- ============================================================================

-- Set the serial numbers to reset (replace with actual serial numbers)
DO $$
DECLARE
    target_serial_numbers VARCHAR(4)[] := ARRAY['ABCD', 'EFGH', 'IJKL']; -- REPLACE WITH ACTUAL SERIAL NUMBERS
    current_serial_number VARCHAR(4);
    qr_code_record RECORD;
    subscription_record RECORD;
    order_record RECORD;
    access_right_record RECORD;
    order_item_record RECORD;
    affected_qr_code VARCHAR(255);
    affected_subscription_id UUID;
    affected_order_id UUID;
    affected_user_id UUID;
    reset_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Log the start of the batch reset process
    RAISE NOTICE 'Starting batch QR code state reset for % serial numbers', array_length(target_serial_numbers, 1);
    
    -- Process each serial number
    FOREACH current_serial_number IN ARRAY target_serial_numbers
    LOOP
        BEGIN
            RAISE NOTICE 'Processing serial number: %', current_serial_number;
            
            -- Find the QR code record by serial number
            SELECT * INTO qr_code_record 
            FROM physical_qr_codes 
            WHERE serial_number = current_serial_number;
            
            IF NOT FOUND THEN
                RAISE NOTICE 'WARNING: QR code with serial number % not found, skipping', current_serial_number;
                error_count := error_count + 1;
                CONTINUE;
            END IF;
            
            affected_qr_code := qr_code_record.qr_code;
            RAISE NOTICE 'Found QR code: %', affected_qr_code;
            
            -- 1. Find and delete access rights associated with this QR code
            DELETE FROM access_rights 
            WHERE qr_code = affected_qr_code;
            
            -- 2. Find subscriptions that reference this QR code in metadata
            FOR subscription_record IN 
                SELECT id, metadata, user_id
                FROM subscriptions 
                WHERE metadata->>'qrCode' = affected_qr_code
            LOOP
                affected_subscription_id := subscription_record.id;
                affected_user_id := subscription_record.user_id;
                
                -- 3. Find the order associated with this subscription
                IF subscription_record.metadata->>'orderId' IS NOT NULL THEN
                    affected_order_id := (subscription_record.metadata->>'orderId')::UUID;
                    
                    -- 4. Delete order items for this subscription
                    DELETE FROM order_items 
                    WHERE order_id = affected_order_id 
                    AND item_type = 'SUBSCRIPTION'
                    AND item_name = (
                        SELECT name FROM subscription_plans sp
                        JOIN subscriptions s ON s.plan_id = sp.id
                        WHERE s.id = affected_subscription_id
                    );
                    
                    -- 5. Check if this order has other subscriptions (if not, delete the order)
                    IF NOT EXISTS (
                        SELECT 1 FROM subscriptions 
                        WHERE metadata->>'orderId' = affected_order_id::TEXT
                        AND id != affected_subscription_id
                    ) THEN
                        DELETE FROM orders WHERE id = affected_order_id;
                    END IF;
                END IF;
                
                -- 6. Delete the subscription
                DELETE FROM subscriptions WHERE id = affected_subscription_id;
            END LOOP;
            
            -- 7. Reset the physical QR code to AVAILABLE state
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
                        'reset_reason', 'Batch reset via script'
                    )
                ),
                updated_at = NOW()
            WHERE serial_number = current_serial_number;
            
            reset_count := reset_count + 1;
            RAISE NOTICE 'Successfully reset QR code: %', affected_qr_code;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'ERROR processing serial number %: %', current_serial_number, SQLERRM;
        END;
    END LOOP;
    
    -- Log the completion
    RAISE NOTICE 'Batch QR code state reset completed';
    RAISE NOTICE 'Successfully reset: % QR codes', reset_count;
    RAISE NOTICE 'Errors encountered: % QR codes', error_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during batch QR code reset: %', SQLERRM;
END $$;

-- ============================================================================
-- Verification Queries (run these after the reset to verify the state)
-- ============================================================================

-- Check the QR code states
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
WHERE serial_number = ANY(ARRAY['ABCD', 'EFGH', 'IJKL']); -- REPLACE WITH ACTUAL SERIAL NUMBERS

-- Verify no access rights exist for these QR codes
SELECT COUNT(*) as remaining_access_rights
FROM access_rights ar
JOIN physical_qr_codes pqc ON ar.qr_code = pqc.qr_code
WHERE pqc.serial_number = ANY(ARRAY['ABCD', 'EFGH', 'IJKL']); -- REPLACE WITH ACTUAL SERIAL NUMBERS

-- Verify no subscriptions reference these QR codes
SELECT COUNT(*) as remaining_subscriptions
FROM subscriptions s
JOIN physical_qr_codes pqc ON s.metadata->>'qrCode' = pqc.qr_code
WHERE pqc.serial_number = ANY(ARRAY['ABCD', 'EFGH', 'IJKL']); -- REPLACE WITH ACTUAL SERIAL NUMBERS

-- ============================================================================
-- Usage Instructions:
-- ============================================================================
-- 1. Replace the serial numbers in the array with actual 4-character serial numbers
-- 2. Run the script in a transaction to ensure atomicity
-- 3. Review the verification queries to confirm the reset was successful
-- 4. Clear application cache for the affected QR codes
-- 5. Consider backing up the database before running this script in production
-- ============================================================================ 