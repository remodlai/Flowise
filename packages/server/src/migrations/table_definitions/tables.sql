-- application_folders
create table public.application_folders (
  id uuid not null default gen_random_uuid (),
  application_id uuid not null,
  name text not null,
  path text not null,
  parent_folder_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint application_folders_pkey primary key (id),
  constraint application_folders_application_id_fkey foreign KEY (application_id) references applications (id) on delete CASCADE,
  constraint application_folders_parent_folder_id_fkey foreign KEY (parent_folder_id) references application_folders (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_application_folders_updated_at BEFORE
update on application_folders for EACH row
execute FUNCTION update_updated_at_column ();

--applications

create table public.applications (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint applications_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_applications_updated_at BEFORE
update on applications for EACH row
execute FUNCTION update_updated_at_column ();

--custom roles
create table public.custom_roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  base_role text null,
  context_type text not null,
  context_id uuid null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint custom_roles_pkey primary key (id),
  constraint custom_roles_name_context_type_context_id_key unique (name, context_type, context_id),
  constraint custom_roles_created_by_fkey foreign KEY (created_by) references auth.users (id)
) TABLESPACE pg_default;

--files
create table public.files (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  name text null,
  content - type text null,
  size bigint null,
  url text null,
  uuid uuid null default gen_random_uuid (),
  constraint files_pkey primary key (id)
) TABLESPACE pg_default;

--organization_users

create table public.organization_users (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  user_id uuid not null,
  role text not null default 'member'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint organization_users_pkey primary key (id),
  constraint organization_users_organization_id_user_id_key unique (organization_id, user_id),
  constraint organization_users_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_organization_users_updated_at BEFORE
update on organization_users for EACH row
execute FUNCTION update_updated_at_column ();

--organizaitons
create table public.organizations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  application_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint organizations_pkey primary key (id),
  constraint organizations_application_id_fkey foreign KEY (application_id) references applications (id)
) TABLESPACE pg_default;

create trigger update_organizations_updated_at BEFORE
update on organizations for EACH row
execute FUNCTION update_updated_at_column ();

--permission_categories (this has data)
create table public.permission_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  constraint permission_categories_pkey primary key (id),
  constraint permission_categories_name_key unique (name)
) TABLESPACE pg_default;

--permissions (this has data)
create table public.permissions (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  category_id uuid not null,
  context_types text[] not null,
  created_at timestamp with time zone not null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_name_key unique (name),
  constraint permissions_category_id_fkey foreign KEY (category_id) references permission_categories (id)
) TABLESPACE pg_default;

--platforms (there is only 1 platform)
create table public.platforms (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint platforms_pkey primary key (id)
) TABLESPACE pg_default;

--role_permissions this has data
create table public.role_permissions (
  id uuid not null default gen_random_uuid (),
  role_id uuid not null,
  permission text not null,
  created_at timestamp with time zone not null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_key unique (role_id, permission),
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references custom_roles (id) on delete CASCADE
) TABLESPACE pg_default;

--user_custom_roles (this has data)
create table public.user_custom_roles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  role_id uuid not null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint user_custom_roles_pkey primary key (id),
  constraint user_custom_roles_user_id_role_id_key unique (user_id, role_id),
  constraint user_custom_roles_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint user_custom_roles_role_id_fkey foreign KEY (role_id) references custom_roles (id) on delete CASCADE,
  constraint user_custom_roles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

--user_profiles (this has data)
create table public.user_profiles (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  meta jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION update_updated_at_column ();