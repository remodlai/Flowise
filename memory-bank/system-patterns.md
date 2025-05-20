# System Pattern: Flowise Monorepo Build & Serve

This document outlines the build and development server patterns for the standard Flowise monorepo. Understanding this is key to integrating new packages, such as a custom UI.

## 1. Monorepo Structure & Tooling

-   **PNPM Workspaces:** The project uses PNPM workspaces, defined in the root `pnpm-workspace.yaml` (typically `packages/*`).
-   **Turbo:** Turborepo is used as the build orchestrator and task runner, configured via `turbo.json` at the root.

## 2. Core Packages Involved

-   **`packages/server`:** The Node.js/Express backend.
    -   `package.json` name: `flowise`
-   **`packages/ui`:** The React-based frontend.
    -   `package.json` name: `flowise-ui`
-   **`packages/components`:** Shared library for nodes, interfaces, utilities.
    -   `package.json` name: `flowise-components`

## 3. Development Mode (`pnpm dev` from root)

-   The root `dev` script (`turbo run dev --parallel --no-cache`) initiates development servers for relevant packages.
-   **`packages/ui` (Frontend):**
    -   Runs its own `dev` script, which is `vite`.
    -   The Vite development server starts (e.g., on `http://localhost:8080` by default, configurable via `.env` in `packages/ui`).
    -   It proxies API requests (typically `/api/v1/*`) to the backend server. This is configured in `packages/ui/vite.config.js`.
    -   Provides Hot Module Replacement (HMR) for frontend changes.
-   **`packages/server` (Backend):**
    -   Runs its `dev` script, which is `nodemon`.
    -   `nodemon` (configured via `packages/server/nodemon.json`) watches TypeScript source files (`src/`, `index.ts`, `commands/`).
    -   On file changes, `nodemon` re-executes the server\'s `pnpm start` script (which in turn runs the compiled JavaScript server, typically from `packages/server/dist/` via `packages/server/bin/run start`).
    -   The backend server typically runs on a different port (e.g., `http://localhost:3000`, configurable via `.env` in `packages/server`).

## 4. Build Process (`pnpm build` from root)

-   The root `build` script (`turbo run build`) orchestrates the build process for all packages.
-   **`packages/components`:** Compiles TypeScript, output likely to `packages/components/dist/`.
-   **`packages/ui`:**
    -   Runs its `build` script (`vite build`).
    -   Vite bundles the React application into static assets (HTML, JS, CSS).
    -   Output is placed in `packages/ui/build/` (as per its `vite.config.js`).
-   **`packages/server`:**
    -   Runs its `build` script (`tsc`).
    -   TypeScript is compiled to JavaScript, output to `packages/server/dist/`.

## 5. Serving in a Production-like Environment (e.g., using `pnpm start` from root)

-   The root `start` script executes `packages/server/bin/run start` (platform-specific).
-   This starts the compiled Node.js/Express server from `packages/server/dist/index.js`.
-   **Static UI Serving:**
    -   The Express server (`packages/server/src/index.ts`) is configured to serve static files.
    -   It looks for the `flowise-ui` package in its `node_modules` (which `packages/ui` is linked to in the monorepo).
    -   It serves the contents of `flowise-ui/build/` from the root path (`/`).
    -   It also serves `flowise-ui/build/index.html` for any unhandled routes to support SPA client-side routing.
-   **API Serving:**
    -   The same Express server handles all API requests (typically under `/api/v1/`).

This pattern allows for a unified development experience with HMR for the frontend and auto-restarts for the backend, while producing a server capable of serving both its API and the static UI assets for production.

## 6. Project Management & Context Tools

To facilitate AI-assisted development and maintain a clear understanding of project goals, decisions, and ongoing work, the Remodl AI Platform development process utilizes the following MCP (Model Context Protocol) tool suites:

### 6.1. Memory Bank (`mcp_memory-bank-mcp_*` tools)

-   **Purpose:** Provides persistent storage and retrieval for key project documentation and context.
-   **Path:** The primary Memory Bank is located at `/Users/brianbagdasarian/projects/Flowise/memory-bank`.
    -   *Note:* This path is currently triply nested due to previous initialization behavior. While functional, it may be revised to a simpler path (e.g., `/Users/brianbagdasarian/projects/Flowise/memory-bank`) in the future.
-   **Core Files Managed:**
    -   `project-brief.md`: High-level overview, objectives, and architecture of the Remodl AI Platform.
    -   `active-context.md`: Dynamic document tracking current tasks, known issues, next steps, and session notes. Updated frequently.
    -   `system-patterns.md` (this file): Documents established architectural patterns, build processes, and tooling conventions.
    -   `decision-log.md`: Records significant architectural or strategic decisions, alternatives considered, and rationale.
    -   `progress.md`: Tracks overall progress on major development efforts or epics (less granular than `active-context.md`).
    -   Other files as needed (e.g., API documentation artifacts, research notes).
-   **Interaction:** The AI Agent uses `mcp_read_memory_bank_file` and `mcp_write_memory_bank_file` for full file operations, and `mcp_update_active_context`, `mcp_log_decision`, `mcp_track_progress` for structured updates to specific files.

#### 6.1.1. Creating Subdirectories in Memory Bank

-   **Pattern:** The `mcp_memory-bank-mcp_write_memory_bank_file` tool may not automatically create intermediate subdirectories within the Memory Bank\'s configured path if they do not already exist.
-   **Solution:**
    1.  To write a file to a nested path (e.g., `MEMORY_BANK_ROOT/api_documentation/endpoint_mappings/file.md`), first ensure the subdirectories (`api_documentation/endpoint_mappings/`) exist.
    2.  Use the `run_terminal_cmd` tool with `mkdir -p [full_absolute_path_to_memory_bank_root]/sub/directory` to create the necessary directory structure. (Replace `[full_absolute_path_to_memory_bank_root]` with the actual path like `/Users/brianbagdasarian/projects/Flowise/memory-bank`).
    3.  Once the directories are confirmed to exist (or created by `mkdir -p`), then use `mcp_memory-bank-mcp_write_memory_bank_file` with the relative path from the Memory Bank root (e.g., `filename = \"sub/directory/file.md\"`).
-   **Context:** This pattern was established when creating organized storage for API documentation artifacts. The Memory Bank path is currently `/Users/brianbagdasarian/projects/Flowise/memory-bank`.

### 6.2. Shrimp Task Manager (`mcp_mcp-shrimp-task-manager_*` tools)

-   **Purpose:** Provides a structured, multi-stage workflow for planning, analyzing, reflecting on, and decomposing complex development tasks into manageable sub-tasks.
-   **Data Storage:** Manages its state internally. The file system path for this data is not directly managed by the AI Agent via tool parameters.
-   **Key Workflow:** `plan_task` -> `analyze_task` -> `reflect_task` -> `process_thought` (used by AI during analysis/reflection) -> `split_tasks` -> `list_tasks`, `get_task_detail`, `update_task`, `execute_task`, `verify_task`, `delete_task`.
-   **Project Standards Integration (`rules.md`):**
    -   The `init_project_rules` command guides AI to create/update `rules.md` at `/Users/brianbagdasarian/projects/Flowise/memory-bank/tasks/rules.md`.
    -   This `rules.md` defines project-specific development standards for AI Agent operations.

### 6.3. Interaction and Separation

-   **Separate Concerns:** Memory Bank for general project context/documentation; Shrimp Task Manager for detailed task lifecycles.
-   **Shared Knowledge Source (`rules.md`):** Shrimp Task Manager prompts creation of `rules.md`; its content might be summarized/referenced in main Memory Bank files.
-   **AI Responsibility:** Use both tool suites appropriately.

### 6.4. OpenAPI Specification Strategy (Internal Remodl Core API)

-   **Objective:** To create a comprehensive and maintainable OpenAPI 3.1.0 specification for the internal APIs of the Remodl Core server component.
-   **Storage Location for Artifacts (Memory Bank Root: `/Users/brianbagdasarian/projects/Flowise/memory-bank`):**
    -   **Schema Definitions:** Stored in YAML format within `api_documentation/schemas/` relative to the Memory Bank root. This directory is further organized:
        -   `api_documentation/schemas/shared/`: For common, reusable schema definitions (e.g., `ErrorResponse.yaml`, `Pagination.yaml`, common enums like `DocumentStoreStatusEnum.yaml`). File per distinct shared schema.
        -   `api_documentation/schemas/modules/`: For module-specific schema definitions. Each module will have its own YAML file (e.g., `documentStoreSchemas.yaml`, `chatflowsSchemas.yaml`). These files will contain all schema definitions for DTOs, request/response bodies, and enums primarily used by that module\'s API endpoints. Schemas within these files should be named clearly (e.g., `DocumentStoreDTO`, `ChatflowRequest`).
    -   **Path Item Fragments:** Each API endpoint\'s path item object will be defined in its own YAML file, stored in a module-specific subdirectory under `api_documentation/openapi_fragments/` (e.g., `api_documentation/openapi_fragments/documentstore/internalDocumentStoreGetById.yaml`). These fragments will use `$ref: \'#/components/schemas/SchemaName\'` to point to schemas defined in `schemas/shared/` or `schemas/modules/` files (e.g., `DocumentStoreDTO` would be defined in `documentStoreSchemas.yaml` but referenced as `#/components/schemas/DocumentStoreDTO` in the final assembled spec).\
    -   **Markdown Analysis:** Detailed per-endpoint analysis will be stored in Markdown files under module-specific subdirectories in `api_documentation/endpoint_analysis/` (e.g., `api_documentation/endpoint_analysis/documentstore/internalDocumentStoreGetById.md`).
    -   **Final Assembled Specification:** The complete, single OpenAPI specification will be `api_documentation/remodl-core-internal-api-v1.yaml` (managed by Task API_DOC_P3, which will involve consolidating all schema and fragment files).\
-   **Workflow for Documenting a Module:**
    1.  **Define/Update Module Schemas:** Before documenting individual endpoints of a module, first ensure all relevant DTOs, complex request/response structures, and enums for that module are fully defined as OpenAPI schemas in `api_documentation/schemas/modules/[moduleName]Schemas.yaml` (or `api_documentation/schemas/shared/` if applicable). Update or create these files as needed.\
    2.  **Document Each Endpoint:**
        *   Create a detailed Markdown analysis file.
        *   Create an OpenAPI path item fragment YAML file, using `$ref` to link to the pre-defined schemas (e.g., `$ref: \'#/components/schemas/DocumentStoreDTO\'`).
-   **Schema Detail:** All schemas must be fully defined, mapping TypeScript interfaces/classes/enums to their OpenAPI equivalents (types, formats, properties, required fields, enums, object structures, etc.). For truly dynamic parts *within* a defined schema (e.g., a specific `loaderConfig` object which varies greatly by loader type), `type: object` with `additionalProperties: true` can be used for that specific nested property, but the overall DTO or response object containing it must be fully structured. **The `description` field for such `additionalProperties: true` objects in the OpenAPI schema must clearly state that its structure is dynamic and context-dependent (e.g., \"Structure depends on the specific `loaderId` component\"). The Markdown analysis file for the endpoint should provide examples of common structures for these dynamic objects where possible.**

#### 6.4.1. Common Schema Patterns and Conventions

-   **ErrorResponse Schema:** All error responses should reference `../../schemas/shared/ErrorResponse.yaml#/components/schemas/ErrorResponse` rather than the older `CommonSchemas.yaml` implementation.

-   **DeleteResult Schema:** For TypeORM DeleteResult objects (returned from delete operations), use inline schema definitions rather than external references:
    ```yaml
    schema:
      type: object
      description: "Standard TypeORM DeleteResult object."
      properties:
        raw:
          type: array
          items: {}
          description: "Raw results returned by the database driver."
        affected:
          type: integer
          nullable: true
          description: "Number of rows affected by the delete operation."
    ```
    This approach is preferred because:
    - It keeps the DeleteResult definition (which is not an error response) separate from ErrorResponse.yaml
    - It provides self-contained documentation for the relatively simple DeleteResult structure
    - It maintains consistency with existing modules that use this pattern (e.g., upsert-history, variables)

-   **Authentication:** All secured endpoints should use `ApiKeyAuth` security scheme (not `InternalApiKeyAuth`).

### 6.5. Planned Enhancement: Remodl Core API Key Ownership Integration

-   **Objective:** To establish a clear link between Remodl Core API keys and the Remodl AI Platform's entities, primarily the `Application`, for improved auditing, management, and traceability.
-   **Context:** The Remodl AI Platform uses Supabase (JWT-based) for user authentication. Remodl Core (this engine) uses its own API key system (opaque tokens verified against salted hashes).
-   **Refined `ApiKey` Entity & Table Strategy:**
    1.  **Core Linkage:** Each Remodl Core `ApiKey` will be fundamentally linked to a single Remodl AI Platform `Application`.
    2.  **Entity Modification (`packages/server/src/database/entities/ApiKey.ts`):**
        *   `id`: Ensure type is `uuid` (e.g., `@PrimaryGeneratedColumn('uuid')`), aligning with database migration.
        *   `applicationId` (uuid, **NOT NULLABLE**): This field will store the ID of the Remodl AI Platform Application to which this `ApiKey` grants access. This is the primary platform context for the key.
        *   `organizationId` (uuid, **NULLABLE**): May store the ID of the platform organization that owns the application or provisioned the key (for administrative tracking).
        *   `userId` (uuid, **NULLABLE**): May store the ID of the platform user who created or is responsible for this specific `ApiKey` instance (for administrative tracking).
        *   `createdDate`: Add `@CreateDateColumn()` for audit purposes.
    3.  **Runtime Context for Operations:** The specific `platform_user_id` and `platform_organization_id` for an individual operation executed using an `ApiKey` will be passed dynamically by the calling service (e.g., API Gateway or platform backend) into Remodl Core, typically within the `overrideConfig` payload of the request. Remodl Core services will use these runtime values for finer-grained data scoping and logging.
    4.  **API Key Creation Endpoint (`POST /api/v1/apikey`):** This endpoint in Remodl Core will be updated to accept `applicationId` (mandatory) and optionally `organizationId` and `userId` (for administrative linkage of the key itself) in the request body.
-   **Benefits:**
    *   **Clear Application Scoping for Keys:** Each `ApiKey` unambiguously belongs to one Platform Application.
    *   **Dynamic Operational Context:** Allows a single application `ApiKey` to be used for operations initiated by different users and organizations within that application's scope, with the specific user/org context provided per-request.
    *   **Traceability & Auditing:** Enables better tracking of API key usage back to applications and, indirectly through runtime context, to specific users/orgs.
-   **Implementation Timing:** This enhancement is planned as a subsequent task after the completion of the current high-priority API documentation efforts for Remodl Core.
-   **Migration Strategy:**
    -   The new `applicationId`, `organizationId`, and `userId` columns (and `createdDate`) will be added to the `ApiKey` entity and its corresponding `apikey` table. `applicationId` will be NOT NULL, while `organizationId` and `userId` will be NULLABLE.

### 6.5.1. Related Consideration: Platform-Contextual File Management

-   **Challenge:** Remodl Core currently uses a single S3 bucket (if S3 is configured) and its internal `UpsertHistory` table does not directly link uploaded files/upserts to platform-specific contexts like user, organization, or application IDs.
-   **Proposed Solution: Storage Orchestration Service / File Bridge Service:**
    -   A dedicated middleware or service layer will be developed as part of the Remodl AI Platform.
    -   **Responsibilities:**
        -   Receive file upload requests from the platform UI, which will include platform context (user ID, org ID, app ID) and potentially source file location (e.g., from a user-specific S3 bucket).
        -   If necessary, fetch the file from its original platform-specific location.
        -   Upload/transfer the file to Remodl Core's designated single S3 bucket, using the keying conventions expected by Remodl Core (e.g., `chatflowid/timestamp_filename.ext`).
        -   Orchestrate API calls to Remodl Core (e.g., `/vectors/upsert`), using a Remodl Core API key that is linked (via the API Key Ownership enhancement) to the originating platform user/org/app.
        -   **Maintain a `PlatformFileRegistry`:** This new database table (managed by the platform, likely in Supabase) will store metadata to correlate platform-contextualized uploads with their representation and usage within Remodl Core. It would track:
            -   `platform_file_id`
            -   `original_filename`
            -   `platform_user_id`, `platform_organization_id`, `platform_application_id`
            -   `source_s3_bucket` / `source_s3_key` (if applicable)
            -   `remodl_core_chatflow_id`
            -   `remodl_core_s3_bucket`, `remodl_core_s3_key`
            -   `remodl_core_upsert_history_id` (optional link)
            -   Timestamps, status, etc.
    -   **Benefits:** This approach allows Remodl Core to maintain its simpler single-bucket storage model while enabling the platform to manage files with full multi-tenant context, traceability, and auditing. It decouples Remodl Core from the platform's specific storage organization.

### 6.6. Platform Evolution: Private Packages and New Repository

-   **Strategy:** To further decouple the Remodl AI Platform from the base Flowise codebase and facilitate independent evolution, the following steps are planned:
    1.  **Integration & Staging Repository:** The current `Flowise` fork will serve as an integration point for upstream Flowise changes and as the source for building adapted core packages.
    2.  **Private NPM Packages:**
        *   `packages/server` will be adapted and published as `@remodl/core-engine`.
        *   `packages/components` will be adapted and published as `@remodl/core-components`.
        *   `packages/ui` will be duplicated and significantly customized, then published as `@remodl/platform-ui`.
        *   These packages will be published to a private NPM registry (e.g., GitHub Packages).
    3.  **New `Remodl-Platform` Repository:** A new, separate Git repository will house the primary Remodl AI Platform application(s). This new repository will consume the `@remodl/*` packages as versioned dependencies.
    4.  **TypeScript Path Mapping/Aliasing:** Within the `Remodl-Platform` repository, TypeScript `paths` or bundler aliases will be used to allow for cleaner import paths (e.g., importing from `components` while actually using `@remodl/core-components`).
-   **Benefits:** This approach provides maximum isolation, customization freedom for the platform, clear ownership, and independent release cycles, while still allowing for controlled incorporation of valuable upstream Flowise updates via the integration repository.

### 6.7. Platform Context Propagation into Chat Flows

-   **Objective:** To enable Remodl Core chat flows to be aware of the specific Remodl AI Platform end-user interacting with them, allowing for personalized and context-aware behavior within the flow.
-   **Pattern:**
    1.  **Platform User Authentication:** The end-user authenticates with the Remodl AI Platform UI (e.g., via Supabase Auth), obtaining a platform-specific JWT containing user claims.
    2.  **JWT via `overrideConfig`:** When the platform UI or its backend/API Gateway initiates a Remodl Core chat flow execution (e.g., via `POST /api/v1/predictions/{chatflow_id}`), it includes the end-user's JWT string within the `overrideConfig` payload (e.g., `overrideConfig: { "user_platform_jwt": "eyJ..." }`). This call to Remodl Core is authenticated using a Remodl Core API Key (machine-to-machine).
    3.  **Chat Flow Processing:**
        *   An input node within the chat flow is configured to receive the `user_platform_jwt` value from `overrideConfig`.
        *   This JWT string is then passed to a "Custom Function" node within the chat flow.
        *   The Custom Function node contains JavaScript logic to:
            *   Decode the JWT payload (e.g., using a library like `jwt-decode`).
            *   Extract relevant claims (e.g., platform user ID, roles, preferences).
            *   Make these claims available as outputs for use by downstream nodes in the chat flow.
-   **Benefits:**
    *   Allows chat flows to personalize responses or behavior based on the platform user.
    *   Enables chat flows to make decisions or fetch further user-specific data by leveraging the extracted claims.
    *   Maintains a separation of concerns: Remodl Core authenticates the calling service via its API key, while the JWT provides end-user context for the flow's internal logic.
-   **Security Considerations:**
    *   **JWT Verification:** The primary validation (signature check, expiry, etc.) of the end-user's JWT should ideally occur at the API Gateway or the platform backend *before* the JWT is passed to Remodl Core.
    *   If the Custom Function node within Flowise needs to *re-verify* the JWT signature (for defense-in-depth), it would require secure access to the appropriate public key or shared secret, which needs careful management within the custom function's execution environment. For many use cases, relying on the upstream (gateway/platform backend) validation is sufficient, and the custom function only decodes the already validated token.
    *   Sensitive claims extracted from the JWT should be handled carefully within the chat flow and not unnecessarily exposed or logged.
-   **Caveat:** This pattern is the current design decision and may be updated or refined as the platform evolves.

### 6.8. Data Tenancy Strategy for Core Remodl Engine Entities

-   **Objective:** To ensure that key data entities within Remodl Core can be associated with platform-level contexts such as `Application`, `Organization`, and `User (Platform User / Creator)`, enabling multi-tenancy, proper data scoping, and contextual filtering.
-   **General Approach:** Add `applicationId` (uuid), `organizationId` (uuid), and `userId` (uuid) columns to relevant Remodl Core tables. The nullability of `organizationId` and `userId` will depend on the specific entity and its relationship to these contexts. The `applicationId` on these entities will generally be non-nullable (potentially defaulting to a generic platform application ID if no specific app context is available during creation, with this default being handled by application logic).

-   **Specific Entity Decisions:**

    *   **`ApiKey` Table (`apikey`):**
        *   `applicationId`: **NOT NULLABLE**. Links the `ApiKey` to a specific Remodl AI Platform Application. This is its primary platform scope.
        *   `organizationId`: **NULLABLE**. Can represent the organization that owns the application or provisioned the key (for administrative tracking).
        *   `userId`: **NULLABLE**. Can represent the platform user who created/owns this `ApiKey` instance (for administrative tracking).
        *   `id` column type to be aligned to `uuid` (from `varchar(20)` in entity) to match migration.
        *   `createdDate` column to be added (via `@CreateDateColumn()`).
        *   *Runtime operational context* (specific user/org for a given API call) is passed via `overrideConfig`, not stored directly on the `ApiKey` for every call.

    *   **`ChatFlow` Table (`chat_flow`):**
        *   `applicationId`: **NOT NULLABLE**. Every chat flow belongs to a platform Application. Application logic will ensure population, using a default platform application ID (`3b702f3b-5749-4bae-a62e-fb967921ab80`) if no other context is available.
        *   `organizationId`: **NOT to be added directly.** A chat flow's organizational context is derived through its parent Application's association with an Organization.
        *   `userId`: **NULLABLE**. Represents the Platform User who created the chat flow. Can be NULL for system/template flows.
        *   The existing `apikeyid` column's role needs to be considered in light of these changes (potential deprecation or repurposing for audit).

    *   **`DocumentStore` Table (`document_store`):**
        *   `applicationId`: **NOT NULLABLE**. Must belong to a platform Application.
        *   `organizationId`: **NULLABLE**. If NULL, it's a universal/global store for the application. If populated, it's specific to that organization within the application.
        *   `userId`: **NULLABLE**. Platform User who created/manages this document store configuration.

    *   **`Credential` Table (`credential`):**
        *   `applicationId`: **NOT NULLABLE**. Credentials will be associated with a specific platform Application.
        *   `organizationId`: **NULLABLE**. Allows for application-global credentials (NULL orgId) or organization-specific credentials within an application.
        *   `userId`: **NULLABLE**. Platform User who created/registered the credential.

    *   **`Variable` Table (`variable`):**
        *   `applicationId`: **NOT NULLABLE**. Variables are primarily application-scoped configurations. Application logic will ensure population, potentially using a default platform application ID if a variable is globally applicable across applications or is a system-level variable.
        *   `organizationId`: **NOT to be added directly.** Organization-specific variations of a variable's value would be handled at runtime via `overrideConfig` rather than by having separate variable entries per organization for the same variable name within an application.
        *   `userId`: **NOT to be added directly.** User-specific variable values would also be handled via `overrideConfig`. The `variable` table stores the template or default value for the application.

    *   **`ChatMessage` Table (`chat_message`):**
        *   **No direct `applicationId`, `organizationId`, or `userId` (for interacting user) columns.**
        *   **Context Derivation:** The platform context (Application, Organization, interacting User) for a `chat_message` is derived via its `sessionId`.
        *   The `sessionId` on `chat_message` will be linked to a record in a platform-level `platform_chat_sessions` table (managed by the Remodl AI Platform). This `platform_chat_sessions` table will hold the `platform_user_id`, `platform_organization_id`, and `platform_application_id` for that specific interaction session.
        *   The `chat_message.chatflowid` links to the `ChatFlow` entity, which contains the `applicationId` of the chat flow itself and the `userId` of its creator (Platform User).

    *   **`Execution` Table (`execution`):**
        *   **No direct `applicationId`, `organizationId`, or `userId` (for interacting user) columns for the *runtime/session* context.**
        *   **Context Derivation (Runtime/Session):** Similar to `ChatMessage`, the runtime platform context (Application, Organization, interacting User for that specific execution instance) is derived via its `sessionId` by linking to the `platform_chat_sessions` table.
        *   **Context Derivation (Chatflow Ownership):** The `execution.agentflowId` (which is `chat_flow.id`) links to the `ChatFlow` entity. The `ChatFlow` entity will have its own `applicationId` (for the application it belongs to) and `userId` (for its creator), providing the ownership context of the flow being executed.

    *   **`CustomTemplate` Table (`custom_template`):**
        *   `applicationId`: **NOT NULLABLE**. A custom template is primarily scoped to an Application (either a specific one, or the default platform application ID for global templates).
        *   `organizationId`: **NULLABLE**. If NULL, it's an application-global or truly global template. If populated, it's a template specific to that Organization within the context of the `applicationId`. This supports offering organization-specific template variations.
        *   `userId`: **NULLABLE**. Represents the Platform User who created/uploaded the template. Can be NULL for system-provided templates.

    *   **`ChatMessageFeedback` Table (`chat_message_feedback`):**
        *   `applicationId`: **NOT NULLABLE**. Feedback is tied to the application context of the chat session.
        *   `organizationId`: **NULLABLE**. Captures the organization context of the user providing feedback, if applicable.
        *   `userId`: **NULLABLE**. Represents the Platform User (or an identifier for an end-user if your platform distinguishes them) who *provided* the feedback.

    *   **`Tool` Table (Custom Tools):**
        *   `applicationId`: **NOT NULLABLE**. Custom tools are scoped to a specific platform Application (or the default platform application for globally available tools).
        *   `organizationId`: **NOT to be added directly.** Organization-specific tool variations or visibility would be managed by application logic or how tools are presented/selected within chatflows, rather than direct DB-level org scoping on the tool definition itself.
        *   `userId`: **NULLABLE**. Represents the Platform User who created the custom tool. Can be NULL for system-provided/application-default tools.

    *   **`UpsertHistory` Table (`upsert_history`):**
        *   `applicationId`: **NOT NULLABLE**. Represents the platform Application context *for which the data was upserted*. This is passed by the calling service (e.g., API Gateway/platform backend) and might differ from the `applicationId` of the `chatflowid` on the record if generic/template flows are used for upsertion across different applications.
        *   `organizationId`: **NULLABLE**. Represents the specific platform Organization context if the upserted data is organization-specific. Passed by the calling service. Can be NULL if the upsert is for application-global data.
        *   `userId`: **NULLABLE**. Represents the platform User who *initiated* the upsert action. Passed by the calling service. Can be NULL for system-initiated upserts.
        *   The existing `chatflowid` column links to the (potentially internal/utility) chat flow definition that executed the upsert pipeline.

-   **Prerequisite for Platform Tables:** Remodl Core migrations that add platform-specific foreign key-like columns (e.g., `applicationId`) logically depend on the existence of corresponding platform tables (e.g., `public.applications`) in the target database.
    -   **Bootstrap Migration (Development/Initial Setup):** To facilitate smoother initial development and testing, Remodl Core will include a very early TypeORM migration (e.g., `0000000000000-EnsurePlatformPrerequisites.ts`). This migration will:
        -   Check for the existence of `public.applications`, `public.organizations`, `public.user_profiles`, and the crucial `public.user_sessions` (or `platform_chat_sessions`) table.
        -   If a table does not exist, it will be created using `CREATE TABLE IF NOT EXISTS` with a minimal viable schema. For example:
            -   `public.applications (id uuid PRIMARY KEY, name text NOT NULL DEFAULT 'Default Application')`
            -   `public.organizations (id uuid PRIMARY KEY, name text NOT NULL DEFAULT 'Default Organization')`
            -   `public.user_profiles (id uuid PRIMARY KEY, user_auth_id uuid UNIQUE NOT NULL, email text)` (where `user_auth_id` is intended to reference `auth.users.id`)
            -   `public.user_sessions (id uuid PRIMARY KEY, remodl_core_session_id text UNIQUE, platform_user_id uuid, platform_organization_id uuid, platform_application_id uuid, remodl_core_chat_flow_id uuid, session_start_time timestamptz DEFAULT now())`
        -   This is purely a bootstrapping mechanism for development and does **not** replace the platform's own authoritative schema management for these tables.
    -   **Authoritative Schema Management:** The complete and authoritative schema for platform-specific tables (`applications`, `organizations`, `user_profiles`, `user_sessions`, etc.) **must be managed by the Remodl AI Platform's own migration system** (e.g., Supabase CLI migrations), not by Remodl Core's TypeORM migrations.
    -   **Foreign Key Constraints:** Initially, columns like `applicationId` in Remodl Core tables, and logical links like `sessionId` to `user_sessions`, will be simple types without database-level FOREIGN KEY constraints to the platform tables. This maintains looser coupling during schema evolution. Application logic will enforce referential integrity.

### 6.9. Platform-Side Session Context Management Table (`user_sessions` or `platform_chat_sessions`)

-   **Objective:** To correlate Remodl Core `sessionId`s (found in `chat_message` and `execution` tables) with the specific Remodl AI Platform `User`, `Organization`, and `Application` involved in that interactive session.
-   **Responsibility & Creation:** While critical for Remodl Core's contextual data derivation, the authoritative schema for this table is managed by the Remodl AI Platform's own schema migrations (e.g., Supabase CLI). However, to ensure development and testing viability, the Remodl Core initial bootstrap migration (see 6.8 Prerequisite) will execute a `CREATE TABLE IF NOT EXISTS public.user_sessions (...)` with a minimal viable schema if it's missing.
-   **Essential Columns (Conceptual - to be defined authoritatively by platform migrations):**
    *   `id` (uuid, PK for this session record)
    *   `remodl_core_session_id` (text or uuid, indexed, unique for active sessions): Stores the `sessionId` from Remodl Core.
    *   `platform_user_id` (uuid, FK to platform's user table, NOT NULL): The authenticated platform user for this session.
    *   `platform_organization_id` (uuid, FK to platform's organization table, NOT NULL): The organization context for this session.
    *   `platform_application_id` (uuid, FK to platform's application table, NOT NULL): The application context for this session.
    *   `remodl_core_chat_flow_id` (uuid, FK to Remodl Core's `chat_flow.id`, NOT NULL): The specific chat flow this session is interacting with.
    *   `session_start_time` (timestamp with time zone, `default now()`, NOT NULL)
    *   `last_activity_time` (timestamp with time zone, `default now()`)
    *   `status` (text, e.g., 'active', 'ended', 'expired', `default 'active'`)
    *   `metadata` (jsonb, NULLABLE): For other session-specific data.
-   **Workflow:** The platform backend/API Gateway is responsible for creating/updating records in this table when a user session starts and interacts with a Remodl Core chat flow, linking the Remodl Core `sessionId` to the full platform context.
-   **Benefit:** Enables derivation of full platform context for `ChatMessage` and `Execution` records via their `sessionId` without needing to add redundant ownership columns directly to those high-volume Remodl Core tables.
