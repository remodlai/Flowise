-- Create flow_runs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flow_runs') THEN
        CREATE TABLE public.flow_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
            organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            flow_id UUID NOT NULL,
            chat_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
            status TEXT NOT NULL DEFAULT 'running',
            error TEXT,
            duration_ms INTEGER,
            input_text TEXT,
            output_text TEXT,
            source TEXT DEFAULT 'web',
            model_name TEXT,
            tokens_used INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_flow_runs_updated_at
        BEFORE UPDATE ON public.flow_runs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        -- Create indexes for faster lookups
        CREATE INDEX idx_flow_runs_application_id ON public.flow_runs(application_id);
        CREATE INDEX idx_flow_runs_organization_id ON public.flow_runs(organization_id);
        CREATE INDEX idx_flow_runs_user_id ON public.flow_runs(user_id);
        CREATE INDEX idx_flow_runs_flow_id ON public.flow_runs(flow_id);
        CREATE INDEX idx_flow_runs_chat_id ON public.flow_runs(chat_id);
        CREATE INDEX idx_flow_runs_status ON public.flow_runs(status);
        CREATE INDEX idx_flow_runs_created_at ON public.flow_runs(created_at);
    END IF;
END
$$;

-- Create a trigger to update application_stats when a flow run is completed
CREATE OR REPLACE FUNCTION update_application_stats_on_flow_run()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stats when a run is completed (success or error)
    IF NEW.status IN ('success', 'error') AND OLD.status = 'running' THEN
        -- Update the run count in application_stats
        UPDATE public.application_stats
        SET 
            run_count = run_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_stats_on_flow_run'
    ) THEN
        CREATE TRIGGER update_stats_on_flow_run
        AFTER UPDATE ON public.flow_runs
        FOR EACH ROW
        EXECUTE FUNCTION update_application_stats_on_flow_run();
    END IF;
END
$$;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.flow_runs TO authenticated; 