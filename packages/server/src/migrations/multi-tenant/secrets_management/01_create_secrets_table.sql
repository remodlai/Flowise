-- Create a table for storing all types of secrets
CREATE TABLE IF NOT EXISTS public.secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT UNIQUE, -- For API keys, this is the API key ID
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'api_key', 'credential', etc.
    value TEXT NOT NULL, -- Encrypted value
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER update_secrets_updated_at
BEFORE UPDATE ON public.secrets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 