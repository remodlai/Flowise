# Endpoint Analysis: GET /api/v1/components-credentials/

**Module:** `components-credentials`
**Operation ID:** `internalComponentsCredentialsGetAll`
**Description:** Retrieves definitions for all available credential components loaded in the Remodl Core application. These are not stored credentials instances but the structural definitions of credential types (e.g., API keys, OAuth, etc.).

**Key Files:**
*   **Router:** `packages/server/src/routes/components-credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/components-credentials/index.ts` (Handler: `getAllComponentsCredentials`)
*   **Service:** `packages/server/src/services/components-credentials/index.ts` (Method: `getAllComponentsCredentials`)
*   **Data Source:** `appServer.nodesPool.componentCredentials` (in-memory pool of loaded credential component definitions)

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/components-credentials/`

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved all credential component definitions.
    *   **Content (`application/json`):**
        *   Schema: An object where each key is the credential component's `name` (e.g., "openAIApi"), and the value is its definition object (structure varies per credential but includes `label`, `name`, `version`, `description`, `inputs`, etc., typically from `ICredential` interface).
*   **`500 Internal Server Error`:**
    *   **Description:** Server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller calls service.
2. Service accesses `appServer.nodesPool.componentCredentials` (which contains all loaded credential node definitions from `packages/components/credentials/`).
3. Returns this object.
