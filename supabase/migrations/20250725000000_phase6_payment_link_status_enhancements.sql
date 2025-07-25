-- Phase 6: Payment Link Status Enhancements
-- Date: 2025-07-25
-- Description: Add functions and triggers for automatic payment link status management

-- Function to calculate payment link status based on business rules
CREATE OR REPLACE FUNCTION calculate_payment_link_status(
    p_current_status TEXT,
    p_usage_count INTEGER,
    p_max_uses INTEGER,
    p_expires_at TIMESTAMPTZ
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- If manually completed, keep it completed
    IF p_current_status = 'completed' THEN
        RETURN 'completed';
    END IF;

    -- If manually paused, keep it paused
    IF p_current_status = 'paused' THEN
        RETURN 'paused';
    END IF;

    -- Check if expired
    IF p_expires_at IS NOT NULL AND p_expires_at < NOW() THEN
        RETURN 'expired';
    END IF;

    -- Check if max uses reached (including single-use links with max_uses=1)
    IF p_max_uses IS NOT NULL AND p_usage_count >= p_max_uses THEN
        RETURN 'completed';
    END IF;

    -- Otherwise, it's active
    RETURN 'active';
END;
$$;

-- Function to update payment link status automatically
CREATE OR REPLACE FUNCTION update_payment_link_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_status TEXT;
BEGIN
    -- Calculate the new status
    new_status := calculate_payment_link_status(
        NEW.status,
        NEW.usage_count,
        NEW.max_uses,
        NEW.expires_at
    );

    -- Update the status if it has changed
    IF new_status != NEW.status THEN
        NEW.status := new_status;
        NEW.updated_at := NOW();
        
        -- Log the automatic status change
        INSERT INTO audit_logs (action, affected_id, details)
        VALUES (
            'payment_link_auto_status_update',
            NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', new_status,
                'reason', 'automatic_calculation',
                'usage_count', NEW.usage_count,
                'max_uses', NEW.max_uses,
                'expires_at', NEW.expires_at
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for automatic status updates on payment_links
DROP TRIGGER IF EXISTS trigger_update_payment_link_status ON payment_links;
CREATE TRIGGER trigger_update_payment_link_status
    BEFORE UPDATE ON payment_links
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_link_status();

-- Function to check and update expired payment links (for cron job)
CREATE OR REPLACE FUNCTION update_expired_payment_links()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update all payment links that have expired but are still active or paused
    UPDATE payment_links
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        expires_at IS NOT NULL 
        AND expires_at < NOW() 
        AND status IN ('active', 'paused');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the batch update
    IF updated_count > 0 THEN
        INSERT INTO audit_logs (action, details)
        VALUES (
            'batch_expire_payment_links',
            jsonb_build_object(
                'updated_count', updated_count,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN updated_count;
END;
$$;

-- Function to get payment link statistics with real-time status calculation
CREATE OR REPLACE FUNCTION get_payment_link_statistics(p_merchant_id UUID)
RETURNS TABLE(
    total_links INTEGER,
    active_links INTEGER,
    completed_links INTEGER,
    expired_links INTEGER,
    paused_links INTEGER,
    single_use_links INTEGER,
    total_payments INTEGER,
    total_revenue NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH link_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'active') as active,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'completed') as completed,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'expired') as expired,
            COUNT(*) FILTER (WHERE calculate_payment_link_status(status, usage_count, max_uses, expires_at) = 'paused') as paused,
            COUNT(*) FILTER (WHERE max_uses = 1) as single_use
        FROM payment_links
        WHERE merchant_id = p_merchant_id
    ),
    payment_stats AS (
        SELECT 
            COUNT(*) as payments,
            COALESCE(SUM(amount), 0) as revenue
        FROM merchant_payments
        WHERE merchant_id = p_merchant_id
        AND status IN ('confirmed', 'finished')
    )
    SELECT 
        link_stats.total::INTEGER,
        link_stats.active::INTEGER,
        link_stats.completed::INTEGER,
        link_stats.expired::INTEGER,
        link_stats.paused::INTEGER,
        link_stats.single_use::INTEGER,
        payment_stats.payments::INTEGER,
        payment_stats.revenue::NUMERIC
    FROM link_stats, payment_stats;
END;
$$;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_payment_links_status_expires 
ON payment_links(status, expires_at) 
WHERE expires_at IS NOT NULL;

-- Add index for merchant queries with status
CREATE INDEX IF NOT EXISTS idx_payment_links_merchant_status 
ON payment_links(merchant_id, status);

-- Add index for usage count queries
CREATE INDEX IF NOT EXISTS idx_payment_links_usage 
ON payment_links(usage_count, max_uses) 
WHERE max_uses IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_payment_link_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_expired_payment_links TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_link_statistics TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION calculate_payment_link_status IS 'Calculates the correct status for a payment link based on business rules';
COMMENT ON FUNCTION update_payment_link_status IS 'Trigger function to automatically update payment link status';
COMMENT ON FUNCTION update_expired_payment_links IS 'Batch function to update expired payment links (for cron jobs)';
COMMENT ON FUNCTION get_payment_link_statistics IS 'Returns comprehensive statistics for merchant payment links with real-time status calculation';

