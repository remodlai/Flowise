-- Master script to run all application setup migrations in the correct order

-- First, ensure the update_updated_at_column function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END
$$;

-- 1. Create or update the applications table
\i 01_applications_table.sql

-- 2. Create or update the application_settings table
\i 02_application_settings.sql

-- 3. Create or update the application_stats table
\i application_stats.sql

-- 4. Create or update the application_billing_plans table
\i 03_application_billing_plans.sql

-- 5. Create or update the application_api_keys table
\i 04_application_api_keys.sql

-- 6. Create or update the chat_sessions table
\i 05_chat_sessions.sql

-- 7. Create or update the flow_runs table
\i 06_flow_runs.sql

-- 8. Update organizations table and create organization-related triggers
\i 07_update_organizations.sql

-- 9. Create user stats triggers
\i 08_update_user_stats.sql

-- 10. Create RLS policies
\i 09_rls_policies.sql

-- 11. Create application_chatflows mapping table
\i 10_application_chatflows.sql

-- 12. Migrate existing chatflows to the Platform Sandbox application
\i 11_migrate_existing_chatflows.sql

-- Final step: Verify all tables were created successfully
DO $$
DECLARE
    missing_tables TEXT := '';
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
        missing_tables := missing_tables || 'applications, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_settings') THEN
        missing_tables := missing_tables || 'application_settings, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_stats') THEN
        missing_tables := missing_tables || 'application_stats, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_billing_plans') THEN
        missing_tables := missing_tables || 'application_billing_plans, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_api_keys') THEN
        missing_tables := missing_tables || 'application_api_keys, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
        missing_tables := missing_tables || 'chat_sessions, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flow_runs') THEN
        missing_tables := missing_tables || 'flow_runs, ';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_chatflows') THEN
        missing_tables := missing_tables || 'application_chatflows, ';
    END IF;
    
    IF missing_tables <> '' THEN
        RAISE NOTICE 'The following tables were not created: %', missing_tables;
    ELSE
        RAISE NOTICE 'All application tables were created successfully.';
    END IF;
END
$$; 