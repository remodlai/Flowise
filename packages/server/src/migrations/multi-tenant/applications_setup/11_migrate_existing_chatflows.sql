-- Migrate existing chatflows to the Platform Sandbox application
DO $$
DECLARE
    sandbox_app_id UUID;
BEGIN
    -- Get the Platform Sandbox application ID
    SELECT id INTO sandbox_app_id FROM public.applications WHERE name = 'Platform Sandbox';
    
    -- Only proceed if we found the application
    IF sandbox_app_id IS NOT NULL THEN
        -- Insert existing chatflows into application_chatflows
        INSERT INTO public.application_chatflows (application_id, chatflow_id)
        SELECT 
            sandbox_app_id, 
            CAST(id AS UUID)
        FROM 
            chatflow
        WHERE 
            NOT EXISTS (
                SELECT 1 
                FROM public.application_chatflows 
                WHERE chatflow_id = CAST(chatflow.id AS UUID)
            );
    END IF;
END
$$; 