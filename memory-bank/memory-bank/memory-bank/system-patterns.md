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
    -   On file changes, `nodemon` re-executes the server's `pnpm start` script (which in turn runs the compiled JavaScript server, typically from `packages/server/dist/` via `packages/server/bin/run start`).
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
-   **Path:** The primary Memory Bank is located at `/Users/brianbagdasarian/projects/Flowise/memory-bank/memory-bank/memory-bank`.
    -   *Note:* This path is currently triply nested due to previous initialization behavior. While functional, it may be revised to a simpler path (e.g., `/Users/brianbagdasarian/projects/Flowise/memory-bank`) in the future.
-   **Core Files Managed:**
    -   `project-brief.md`: High-level overview, objectives, and architecture of the Remodl AI Platform.
    -   `active-context.md`: Dynamic document tracking current tasks, known issues, next steps, and session notes. Updated frequently.
    -   `system-patterns.md` (this file): Documents established architectural patterns, build processes, and tooling conventions.
    -   `decision-log.md`: Records significant architectural or strategic decisions, alternatives considered, and rationale.
    -   `progress.md`: Tracks overall progress on major development efforts or epics (less granular than `active-context.md`).
    -   Other files as needed (e.g., draft API specifications, research notes).
-   **Interaction:** The AI Agent uses `mcp_read_memory_bank_file` and `mcp_write_memory_bank_file` for full file operations, and `mcp_update_active_context`, `mcp_log_decision`, `mcp_track_progress` for structured updates to specific files. `mcp_get_memory_bank_status` can be used but has shown some inconsistencies in file listing previously.

#### 6.1.1. Creating Subdirectories in Memory Bank

-   **Pattern:** The `mcp_memory-bank-mcp_write_memory_bank_file` tool may not automatically create intermediate subdirectories within the Memory Bank's configured path if they do not already exist.
-   **Solution:**
    1.  To write a file to a nested path (e.g., `MEMORY_BANK_ROOT/api_documentation/endpoint_mappings/file.md`), first ensure the subdirectories (`api_documentation/endpoint_mappings/`) exist.
    2.  Use the `run_terminal_cmd` tool with `mkdir -p [full_absolute_path_to_memory_bank_root]/api_documentation/endpoint_mappings` to create the necessary directory structure. (Replace `[full_absolute_path_to_memory_bank_root]` with the actual path like `/Users/brianbagdasarian/projects/Flowise/memory-bank/memory-bank/memory-bank`).
    3.  Once the directories are confirmed to exist (or created by `mkdir -p`), then use `mcp_memory-bank-mcp_write_memory_bank_file` with the relative path from the Memory Bank root (e.g., `filename = "api_documentation/endpoint_mappings/file.md"`).
-   **Context:** This pattern was established when creating organized storage for API documentation artifacts. The Memory Bank path is currently `/Users/brianbagdasarian/projects/Flowise/memory-bank/memory-bank/memory-bank`.

### 6.2. Shrimp Task Manager (`mcp_mcp-shrimp-task-manager_*` tools)

-   **Purpose:** Provides a structured, multi-stage workflow for planning, analyzing, reflecting on, and decomposing complex development tasks into manageable sub-tasks.
-   **Data Storage:** Manages its state (plans, analyses, task lists) internally. The exact file system path for this data is not directly exposed or managed by the AI Agent via tool parameters. It is assumed to be within the `.cursor` environment or a similar agent-managed local storage.
-   **Key Workflow:**
    1.  `plan_task`: Initiates a new high-level task with a description and requirements.
    2.  `analyze_task`: The AI performs a detailed analysis of the codebase and task, outputting an initial concept.
    3.  `reflect_task`: The AI reviews the analysis, considers optimizations, and confirms alignment.
    4.  `process_thought` (used by AI during `analyze_task` and `reflect_task`): Allows for iterative, multi-step thinking and research to build up the analysis.
    5.  `split_tasks`: Based on the global analysis, the AI breaks the main task into smaller, actionable sub-tasks with implementation guides and verification criteria.
    6.  `list_tasks`, `get_task_detail`, `update_task`, `execute_task`, `verify_task`, `delete_task`: Used for managing and progressing through the generated sub-tasks.
-   **Project Standards Integration (`rules.md`):**
    -   The `init_project_rules` command within Shrimp Task Manager guides the AI to create/update a `rules.md` file.
    -   This `rules.md` is located at `/Users/brianbagdasarian/projects/Flowise/memory-bank/tasks/rules.md` (note the `tasks/` subdirectory, distinct from the main Memory Bank root used by `mcp_memory-bank-mcp_*` tools for other files).
    -   This `rules.md` defines project-specific development standards for AI Agent operations and is consulted by the Shrimp Task Manager and the AI during task execution.

### 6.3. Interaction and Separation

-   **Separate Concerns:** The Memory Bank (`mcp_memory-bank-mcp_*`) is for general project context and documentation. The Shrimp Task Manager (`mcp_mcp-shrimp-task-manager_*`) is for detailed task planning and execution lifecycles.
-   **Shared Knowledge Source (`rules.md`):** While Shrimp Task Manager *prompts the creation* of `rules.md` and expects it at a specific path (`.../memory-bank/tasks/rules.md`), this file conceptually contains project standards that might also be referenced or summarized in the main Memory Bank's `system-patterns.md` or `project-brief.md` for overall architectural context.
-   **AI Responsibility:** The AI Agent is responsible for using both tool suites appropriately: Memory Bank for context and long-term knowledge, Shrimp Task Manager for structured execution of complex development efforts.
