-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read applications
CREATE POLICY "Allow authenticated users to read applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to read organizations
CREATE POLICY "Allow authenticated users to read organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage applications
CREATE POLICY "Allow platform admins to manage applications"
  ON public.applications
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Allow platform admins to manage organizations
CREATE POLICY "Allow platform admins to manage organizations"
  ON public.organizations
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create triggers to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Insert some sample data
INSERT INTO public.applications (name, description)
VALUES 
  ('Default Application', 'The default application'),
  ('Marketing App', 'Application for marketing teams'),
  ('Sales App', 'Application for sales teams');

INSERT INTO public.organizations (name, description)
VALUES 
  ('Default Organization', 'The default organization'),
  ('Marketing Team', 'Marketing department'),
  ('Sales Team', 'Sales department'); 