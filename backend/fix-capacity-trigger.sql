-- Fix the check_capacity_consistency trigger to handle NULL mapping_id
-- When mapping_id is NULL, check against venue capacity instead

CREATE OR REPLACE FUNCTION check_capacity_consistency()
RETURNS TRIGGER AS $func$
DECLARE
    venue_capacity INTEGER;
    mapping_capacity INTEGER;
BEGIN
    -- If mapping_id is provided, check against mapping capacity
    IF NEW.mapping_id IS NOT NULL THEN
        -- Récupérer les capacités du mapping
        SELECT v.max_capacity, vm.effective_capacity 
        INTO venue_capacity, mapping_capacity
        FROM venues v
        JOIN venue_mappings vm ON v.id = vm.venue_id
        WHERE vm.id = NEW.mapping_id;
        
        -- Vérifier que la capacité de l'événement ne dépasse pas celle du mapping
        IF NEW.max_capacity IS NOT NULL AND mapping_capacity IS NOT NULL AND NEW.max_capacity > mapping_capacity THEN
            RAISE EXCEPTION 'Event capacity (%) exceeds venue mapping capacity (%)', 
                NEW.max_capacity, mapping_capacity;
        END IF;
    -- If mapping_id is NULL but venue_id is provided, check against venue capacity
    ELSIF NEW.venue_id IS NOT NULL THEN
        -- Récupérer la capacité du lieu
        SELECT max_capacity INTO venue_capacity
        FROM venues
        WHERE id = NEW.venue_id;
        
        -- Vérifier que la capacité de l'événement ne dépasse pas celle du lieu
        IF NEW.max_capacity IS NOT NULL AND venue_capacity IS NOT NULL AND NEW.max_capacity > venue_capacity THEN
            RAISE EXCEPTION 'Event capacity (%) exceeds venue capacity (%)', 
                NEW.max_capacity, venue_capacity;
        END IF;
    END IF;
    -- If both mapping_id and venue_id are NULL, skip capacity check
    
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

