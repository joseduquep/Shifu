-- 0007_add_web_scraping_metadata.sql — Add web scraping metadata and audit logging
-- Adds columns and tables to support automated web scraping and data synchronization

-- Add metadata columns to profesores table for web scraping tracking
ALTER TABLE IF EXISTS public.profesores
    ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,  -- URL or unique identifier from external source
    ADD COLUMN IF NOT EXISTS external_source TEXT,  -- e.g., 'eafit_web'
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,  -- Last successful sync
    ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN NOT NULL DEFAULT true,  -- Opt-out mechanism
    ADD COLUMN IF NOT EXISTS manual_override_fields TEXT[],  -- Array of field names that are manually overridden
    ADD COLUMN IF NOT EXISTS raw_scraped_data JSONB;  -- Store raw scraped data for reference

-- Index for efficient lookups by external ID
CREATE INDEX IF NOT EXISTS idx_profesores_external_id 
    ON public.profesores(external_id) 
    WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profesores_sync_enabled 
    ON public.profesores(sync_enabled);

-- Table for storing sync configuration
CREATE TABLE IF NOT EXISTS public.sync_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,  -- e.g., 'eafit_professors'
    source_url TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    schedule_cron TEXT,  -- e.g., '0 2 * * *' for daily at 2am
    field_mappings JSONB NOT NULL,  -- JSON mapping of external fields to internal fields
    last_full_sync_at TIMESTAMPTZ,
    last_incremental_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for audit logging of sync operations
CREATE TABLE IF NOT EXISTS public.sync_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID REFERENCES public.sync_configurations(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB,  -- Store detailed information about the sync
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_config 
    ON public.sync_audit_logs(configuration_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_status 
    ON public.sync_audit_logs(status, started_at DESC);

-- Table for tracking individual record sync attempts
CREATE TABLE IF NOT EXISTS public.sync_record_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id UUID NOT NULL REFERENCES public.sync_audit_logs(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    profesor_id UUID REFERENCES public.profesores(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'failed')),
    reason TEXT,  -- e.g., 'manual_override', 'opt_out', 'validation_error'
    diff JSONB,  -- Store changes made
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for record-level sync tracking
CREATE INDEX IF NOT EXISTS idx_sync_record_logs_audit 
    ON public.sync_record_logs(audit_log_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sync_record_logs_profesor 
    ON public.sync_record_logs(profesor_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sync_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync_configurations updated_at
DROP TRIGGER IF EXISTS trg_sync_configurations_updated_at ON public.sync_configurations;
CREATE TRIGGER trg_sync_configurations_updated_at
    BEFORE UPDATE ON public.sync_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_configuration_updated_at();

-- RLS policies for sync tables (admin only by default)
ALTER TABLE public.sync_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_record_logs ENABLE ROW LEVEL SECURITY;

-- Admin can do everything with sync configurations
CREATE POLICY "Admins can manage sync configurations"
    ON public.sync_configurations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can read all audit logs
CREATE POLICY "Admins can read audit logs"
    ON public.sync_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can read all record logs
CREATE POLICY "Admins can read record logs"
    ON public.sync_record_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- View for sync summary statistics
CREATE OR REPLACE VIEW v_sync_statistics AS
SELECT 
    sc.id as configuration_id,
    sc.name as configuration_name,
    sc.enabled,
    sc.last_full_sync_at,
    sc.last_incremental_sync_at,
    COUNT(sal.id) as total_syncs,
    COUNT(CASE WHEN sal.status = 'completed' THEN 1 END) as successful_syncs,
    COUNT(CASE WHEN sal.status = 'failed' THEN 1 END) as failed_syncs,
    MAX(sal.started_at) as last_sync_at,
    SUM(sal.records_created) as total_records_created,
    SUM(sal.records_updated) as total_records_updated,
    SUM(sal.records_skipped) as total_records_skipped,
    SUM(sal.records_failed) as total_records_failed
FROM public.sync_configurations sc
LEFT JOIN public.sync_audit_logs sal ON sal.configuration_id = sc.id
GROUP BY sc.id, sc.name, sc.enabled, sc.last_full_sync_at, sc.last_incremental_sync_at;

COMMENT ON TABLE public.sync_configurations IS 'Configuration for automated data synchronization from external sources';
COMMENT ON TABLE public.sync_audit_logs IS 'Audit log of all sync operations';
COMMENT ON TABLE public.sync_record_logs IS 'Detailed record-level tracking of sync operations';
COMMENT ON COLUMN public.profesores.external_id IS 'Unique identifier from external source (e.g., profile URL)';
COMMENT ON COLUMN public.profesores.manual_override_fields IS 'Array of field names that should not be overwritten by sync';
COMMENT ON COLUMN public.profesores.sync_enabled IS 'Whether this professor profile should be updated by automated sync';

