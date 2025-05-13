# Endpoint Analysis: GET /api/v1/components-credentials/{name}

**Module:** `components-credentials`
**Operation ID:** `internalComponentsCredentialsGetByName`
**Description:** Retrieves the definition for a specific credential component by its name, provided as a path parameter.

**Key Files:**
*   **Router:** `packages/server/src/routes/components-credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/components-credentials/index.ts` (Handler: `getComponentByName`)
*   **Service:** `packages/server/src/services/components-credentials/index.ts` (Method: `getComponentByName`)
*   **Data Source:** `appServer.nodesPool.componentCredentials`

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/components-credentials/{name}`
*   **Path Parameters:**
    *   `name` (string, required): Name of the credential component (e.g., "openAIApi").

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the credential component definition.
    *   **Content (`application/json`):** Schema based on `ICredential` interface (varies per credential but includes `label`, `name`, `version`, `description`, `inputs`, etc.).
*   **`404 Not Found`:**
    *   **Description:** Credential component with the specified name not found.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   **Description:** Credential name not provided in path (should not happen with this route matching).
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller gets credential name from `req.params.name`.
2. Calls service `getComponentByName(name)`.
3. Service retrieves the definition from `appServer.nodesPool.componentCredentials[name]`.
4. If not found, service throws 404.
5. Returns the credential definition object.
