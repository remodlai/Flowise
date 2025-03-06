-- Example RLS policy using the authorize function
-- This is an example for a hypothetical 'projects' table

-- First, enable RLS on the table
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for different operations

-- Policy for viewing projects
CREATE POLICY view_projects ON public.projects
FOR SELECT
USING (
  public.authorize('view_project')
);

-- Policy for creating projects
CREATE POLICY create_projects ON public.projects
FOR INSERT
WITH CHECK (
  public.authorize('create_project')
);

-- Policy for updating projects
CREATE POLICY update_projects ON public.projects
FOR UPDATE
USING (
  public.authorize('update_project')
)
WITH CHECK (
  public.authorize('update_project')
);

-- Policy for deleting projects
CREATE POLICY delete_projects ON public.projects
FOR DELETE
USING (
  public.authorize('delete_project')
);

-- Example of resource-based policy for a hypothetical 'tasks' table
-- This assumes tasks belong to projects

-- Enable RLS on the tasks table
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy for viewing tasks (resource-based)
CREATE POLICY view_tasks ON public.tasks
FOR SELECT
USING (
  public.authorize_resource('view_task', 'project', project_id)
);

-- Policy for creating tasks (resource-based)
CREATE POLICY create_tasks ON public.tasks
FOR INSERT
WITH CHECK (
  public.authorize_resource('create_task', 'project', project_id)
);

-- Policy for updating tasks (resource-based)
CREATE POLICY update_tasks ON public.tasks
FOR UPDATE
USING (
  public.authorize_resource('update_task', 'project', project_id)
)
WITH CHECK (
  public.authorize_resource('update_task', 'project', project_id)
);

-- Policy for deleting tasks (resource-based)
CREATE POLICY delete_tasks ON public.tasks
FOR DELETE
USING (
  public.authorize_resource('delete_task', 'project', project_id)
);

-- Note: This is an example. You should adapt these policies to your actual tables and schema.
-- The 'projects' and 'tasks' tables are used as examples and may not exist in your database.
-- If they don't exist, these statements will fail with an error. 