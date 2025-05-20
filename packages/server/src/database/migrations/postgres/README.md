# Remodl Core - PostgreSQL Migrations Strategy

This directory contains TypeORM migrations specific to PostgreSQL for the Remodl Core engine.

## Custom Platform-Specific Migrations

Two key migrations have been added to support integration with the Remodl AI Platform and enable multi-tenancy:

### 1. `...-EnsurePlatformPrerequisites.ts` (e.g., `1747754325787-0000000000000-EnsurePlatformPrerequisites.ts`)

*   **Purpose:** This is a **bootstrap migration** designed to run very early in the migration sequence.
*   **Functionality:** It uses `CREATE TABLE IF NOT EXISTS` to create minimal placeholder versions of essential platform-specific tables within the `public` schema if they do not already exist. These tables are:
    *   `public.applications` (stores platform application details)
    *   `public.organizations` (stores platform organization details)
    *   `public.user_profiles` (stores platform user profile details, linked to `auth.users` via a `user_auth_id` column)
    *   `public.user_sessions` (links Remodl Core `sessionId` to platform user, organization, and application context for runtime interactions)
*   **Important Note:** This migration is primarily for facilitating smoother initial development and testing environments. The **authoritative schema definition and ongoing management** of these platform tables (`applications`, `organizations`, `user_profiles`, `user_sessions`, etc.) are the responsibility of the Remodl AI Platform's own dedicated migration system (e.g., using Supabase CLI migrations). This bootstrap migration only ensures their basic existence for Remodl Core to function logically during development if the full platform schema isn't yet deployed.
*   The `down()` method for this migration is intentionally minimal or empty to avoid accidentally dropping platform-managed tables.

### 2. `...-AddPlatformOwnershipFields.ts` (e.g., `1747756806169-AddPlatformOwnershipFields.ts`)

*   **Purpose:** This migration introduces platform data tenancy and ownership context directly into core Remodl Core tables.
*   **Functionality:**
    *   Modifies the `apikey` table:
        *   Aligns its `id` primary key to be `uuid`.
        *   Adds a `createdDate` column.
        *   Adds `applicationId` (NOT NULL), `organizationId` (NULLABLE), and `userId` (NULLABLE) columns for linking API keys to platform entities (primarily for administrative tracking of the key's origin/scope).
    *   Adds platform ownership columns to 9 other core Remodl Engine tables (`chat_flow`, `document_store`, `credential`, `variable`, `custom_template`, `chat_message_feedback`, `tool`, `upsert_history`):
        *   `applicationId` (NOT NULL, default applied for existing rows during migration, e.g., using `'3b702f3b-5749-4bae-a62e-fb967921ab80'`)
        *   `organizationId` (NULLABLE, as per specific entity decisions)
        *   `userId` (NULLABLE, as per specific entity decisions for creator/initiator)
*   **Handling `NOT NULL` Columns on Existing Tables:** Because the target database might already contain Flowise tables with data, this migration uses a 3-step SQL process for adding new `NOT NULL` columns (like `applicationId`):
    1.  `ADD COLUMN "columnName" uuid NULL;` (column is added as nullable)
    2.  `UPDATE "tableName" SET "columnName" = 'DEFAULT_APP_ID_VALUE';` (existing rows are populated with the default platform `applicationId`)
    3.  `ALTER TABLE "tableName" ALTER COLUMN "columnName" SET NOT NULL;` (constraint is applied)
*   This ensures data integrity and allows the migration to run successfully on databases with pre-existing data in the Flowise tables.
*   The `down()` method is scripted to reverse these additions.

These migrations are crucial for enabling multi-tenancy and proper data scoping within the Remodl Core engine as part of the larger Remodl AI Platform. 