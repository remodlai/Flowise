import { MigrationInterface, QueryRunner } from "typeorm";

-   **General Approach:** Add `applicationId` (uuid), `organizationId` (uuid), and `userId` (uuid) columns to relevant Remodl Core tables. The nullability of `organizationId` and `userId` will depend on the specific entity and its relationship to these contexts. The `applicationId` on these entities will generally be non-nullable (potentially defaulting to a generic platform application ID if no specific app context is available during creation, with this default being handled by application logic).

    -   **Transitional Service Layer Handling (Pre-Phase 3):** To prevent `NOT NULL` constraint violations when creating entities via existing API endpoints (before the service layer is fully updated in Phase 3 to accept platform context from the API Gateway), the `create` or `save` methods in the Remodl Core service layer for entities with a new non-nullable `applicationId` will be tactically modified. These methods will temporarily inject `process.env.DEFAULT_PLATFORM_APP_ID` (or a hardcoded fallback like `'3b702f3b-5749-4bae-a62e-fb967921ab80'`) if an `applicationId` is not already present on the incoming entity data. Similarly, new nullable `userId` or `organizationId` fields will be defaulted to `null` if not provided. This is a temporary measure and will be replaced by proper context propagation in Phase 3.

-   **Specific Entity Decisions:** 

### 6.6. Platform Evolution: Repository and Deployment Strategy

-   **Strategy:** To create a dedicated, evolving platform codebase while maintaining an ability to selectively incorporate upstream Flowise updates.
    1.  **Current `Flowise` Fork (Integration & Upstream Tracking):** The existing `Flowise` Git repository (our current workspace) will be maintained primarily to track the upstream `FlowiseAI/Flowise` repository. It can be used to evaluate upstream changes and selectively port bug fixes or specific features.
    2.  **New `remodl-core-platform` Monorepo (Primary Development):**
        *   A **new, separate Git repository** will be created (e.g., `github.com/YourOrg/remodl-core-platform`).
        *   This repository will be initialized with the codebase from the `feature/platform-data-ownership-fields` branch of the current `Flowise` fork. It will contain `packages/server`, `packages/components`, and a new `packages/remodl-platform-ui` (derived from the original `packages/ui` but intended for significant platform-specific admin/development UI customization). The original `packages/ui` may be removed from this new repo.
        *   This new repository will **maintain the PNPM monorepo structure** for these core packages.
        *   **No internal private NPM packaging** of these core components (`server`, `components`, `remodl-platform-ui`) will be done for consumption *within* this monorepo. They will use PNPM workspace linking.
        *   This repository will be the source of truth for the Remodl Core engine and its integrated platform administration/development UI, allowing it to diverge from upstream Flowise as needed for platform features (e.g., `credentialId` refactoring, deep tenancy integration).
    3.  **Deployment:** The `server` component from the `remodl-core-platform` repo can be deployed as main instances and worker instances (for queue mode).
    4.  **Future Application UIs (End-User Facing):**
        *   These will be developed in their own separate repositories (e.g., using Next.js).
        *   They will interact with the `remodl-core-platform` engine **exclusively through the API Gateway**.
-   **Benefits:** Clear separation for platform-specific evolution, development cohesion for the core engine and its admin UI, controlled divergence from upstream, and fully decoupled end-user application UIs. 