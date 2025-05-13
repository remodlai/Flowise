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

### 6.5. Planned Enhancement: Remodl Core API Key Ownership Integration

-   **Objective:** To establish a clear link between Remodl Core API keys and the Remodl AI Platform\'s entities (Users, Organizations, Applications) for improved auditing, management, and traceability.
-   **Context:** The Remodl AI Platform uses Supabase (JWT-based) for user authentication. Remodl Core (this engine) uses its own API key system (opaque tokens verified against salted hashes).
-   **Proposed Change:**
    1.  **Modify `ApiKey` Entity & Table:** Add the following nullable fields to the `packages/server/src/database/entities/ApiKey.ts` entity and its corresponding `apikey` table in the Remodl Core database (via a new TypeORM migration):
        *   `userId: string | null` (or `uuid`, to match platform User IDs)
        *   `organizationId: string | null` (or `uuid`, to match platform Organization IDs)
        *   `applicationId: string | null` (or `uuid`, to match platform Application IDs)
    2.  **Update API Key Creation:**
        *   Modify `apikeyService.createApiKey` and the `POST /api/v1/apikey` controller endpoint to accept these new owner IDs in the request body.
        *   When the Remodl AI Platform backend requests the creation of a Remodl Core API key (e.g., for a new Application or a specific user need), it will provide these IDs.
    3.  **Update API Key Management (Platform Side):**
        *   The Remodl AI Platform backend will be responsible for managing these ownership links.
        *   It will use these IDs to select the appropriate Remodl Core API key when making calls to Remodl Core on behalf of a user, organization, or application.
-   **Benefits:**
    *   **Traceability:** Allows actions performed using a Remodl Core API key to be traced back to a specific platform user, organization, or application.
    *   **Auditing:** Enhances audit logs with platform-level context.
    *   **Lifecycle Management:** Enables the platform to manage the lifecycle of Remodl Core API keys based on platform events (e.g., user deactivation, application deletion).
    *   **Scoped Usage (Future Potential):** While the immediate change is about attribution, this lays the groundwork for potentially more granular, platform-driven authorization policies regarding how these keys can be used.
-   **Implementation Timing:** This enhancement is planned as a subsequent task after the completion of the current high-priority API documentation efforts for Remodl Core.
-   **Migration Strategy:** The new columns will be added as nullable to ensure backward compatibility with existing API keys. A backfill strategy for existing keys may be considered later.
