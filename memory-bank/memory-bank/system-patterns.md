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
