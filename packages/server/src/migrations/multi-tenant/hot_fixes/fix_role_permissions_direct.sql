-- Direct SQL script to assign permissions to the Super Admin role

-- First, let's check if there are any existing role permissions
SELECT COUNT(*) FROM public.role_permissions;

-- Now, let's directly insert the permissions for the Super Admin role
INSERT INTO public.role_permissions (role_id, permission)
VALUES
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'platform.view'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'platform.edit'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'platform.manage_users'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'app.create'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'app.view'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'app.edit'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'app.delete'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'app.manage_users'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'org.create'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'org.view'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'org.edit'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'org.delete'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'org.manage_users'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.clone'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.create'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.delete'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.deploy'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.edit'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.export'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.import'),
('9076e5ba-17ea-48a2-acdd-623f16a19629', 'chatflow.view')
ON CONFLICT (role_id, permission) DO NOTHING;

-- Check if the permissions were added
SELECT 
    cr.name AS role_name,
    rp.permission,
    COUNT(*) OVER() AS total_permissions
FROM 
    public.role_permissions rp
JOIN 
    public.custom_roles cr ON rp.role_id = cr.id
WHERE 
    cr.id = '9076e5ba-17ea-48a2-acdd-623f16a19629'
ORDER BY 
    rp.permission; 