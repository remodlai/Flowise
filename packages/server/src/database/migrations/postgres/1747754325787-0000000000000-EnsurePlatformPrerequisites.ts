import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsurePlatformPrerequisites1747754325787 implements MigrationInterface {
    name = 'EnsurePlatformPrerequisites1747754325787'; // Adjusted class name to match convention

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.applications (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                name text NOT NULL DEFAULT 'Default Application',
                created_at timestamptz DEFAULT now(),
                updated_at timestamptz DEFAULT now()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.organizations (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                name text NOT NULL DEFAULT 'Default Organization',
                application_id uuid, -- Logically REFERENCES public.applications(id) ON DELETE SET NULL, (no hard FK)
                created_at timestamptz DEFAULT now(),
                updated_at timestamptz DEFAULT now()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.user_profiles (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id uuid UNIQUE NOT NULL, -- Changed from user_auth_id to user_id
                email text UNIQUE,
                first_name text,
                last_name text,
                avatar_url text,
                organization_id uuid, -- Logically REFERENCES public.organizations(id) ON DELETE SET NULL, (no hard FK)
                created_at timestamptz DEFAULT now(),
                updated_at timestamptz DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id); -- Changed from user_auth_id
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.user_sessions (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                remodl_core_session_id text UNIQUE,
                platform_user_id uuid NOT NULL, -- This should logically reference user_profiles.user_id (which is auth.users.id)
                platform_organization_id uuid, -- Logically REFERENCES public.organizations(id)
                platform_application_id uuid NOT NULL, -- Logically REFERENCES public.applications(id)
                remodl_core_chat_flow_id uuid, -- Logically REFERENCES Remodl Core's chat_flow(id)
                session_start_time timestamptz DEFAULT now(),
                last_activity_time timestamptz DEFAULT now(),
                status text DEFAULT 'active',
                metadata jsonb
            );
            CREATE INDEX IF NOT EXISTS idx_user_sessions_remodl_core_session_id ON public.user_sessions (remodl_core_session_id);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_platform_user_id ON public.user_sessions (platform_user_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // These tables are platform-level; Remodl Core migrations should generally not drop them.
        // If absolutely necessary for a very clean rollback during dev, they can be un-commented.
        // await queryRunner.query(`DROP TABLE IF EXISTS public.user_sessions;`);
        // await queryRunner.query(`DROP TABLE IF EXISTS public.user_profiles;`);
        // await queryRunner.query(`DROP TABLE IF EXISTS public.organizations;`);
        // await queryRunner.query(`DROP TABLE IF EXISTS public.applications;`);
        // Not dropping uuid-ossp extension as it might be used by other parts of the DB or Supabase itself.
        // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
        // For safety, this down migration does nothing regarding these platform tables.
        // Their lifecycle should be managed by platform-specific migrations.
    }

}
