-- Create chat_sessions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
        CREATE TABLE public.chat_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
            organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            chat_id TEXT NOT NULL,
            flow_id UUID,
            title TEXT NOT NULL DEFAULT 'New Chat',
            source TEXT DEFAULT 'web',
            is_pinned BOOLEAN DEFAULT FALSE,
            message_count INTEGER DEFAULT 0,
            last_message_content TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            last_message_at TIMESTAMPTZ DEFAULT now()
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_chat_sessions_updated_at
        BEFORE UPDATE ON public.chat_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        -- Create indexes for faster lookups
        CREATE INDEX idx_chat_sessions_application_id ON public.chat_sessions(application_id);
        CREATE INDEX idx_chat_sessions_organization_id ON public.chat_sessions(organization_id);
        CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
        CREATE INDEX idx_chat_sessions_flow_id ON public.chat_sessions(flow_id);
        CREATE INDEX idx_chat_sessions_chat_id ON public.chat_sessions(chat_id);
    END IF;
END
$$;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated; 