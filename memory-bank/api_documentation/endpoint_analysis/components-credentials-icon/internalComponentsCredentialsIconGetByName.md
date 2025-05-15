# Endpoint Analysis: GET /api/v1/components-credentials-icon/{name}

**Module:** `components-credentials-icon`
**Operation ID:** `internalComponentsCredentialsIconGetByName`
**Description:** Retrieves the icon file for a specified credential component name. The icon file is served directly from the file system. The root path `/` is configured in the router but will fail as the controller requires `req.params.name`.

**Key Files:**
*   **Router:** `packages/server/src/routes/components-credentials-icon/index.ts`
*   **Controller:** `packages/server/src/controllers/components-credentials/index.ts` (Handler: `getSingleComponentsCredentialIcon`)
*   **Service:** `packages/server/src/services/components-credentials/index.ts` (Method: `getSingleComponentsCredentialIcon`)

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/components-credentials-icon/{name}`
*   **Path Parameters:**
    *   `name` (string, required): Name of the credential component (e.g., "openAIApi") whose icon is requested.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the icon file.
    *   **Content:** Raw image file (image/svg+xml, image/png, or image/jpg)
*   **`412 Precondition Failed`:**
    *   **Description:** Credential name (`name`) not provided in the path.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`404 Not Found`:**
    *   **Description:** Credential not found or icon not defined for the credential.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Error reading the icon file or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller gets `credentialName` from `req.params.name`. Throws 412 if missing.
2. Calls service `getSingleComponentsCredentialIcon(credentialName)`.
3. Service retrieves the credential definition from `appServer.nodesPool.componentCredentials`.
4. Checks if icon property exists and ends with .svg, .png, or .jpg.
5. Returns the filepath string to the icon file.
6. Controller uses `res.sendFile(filepath)` to serve the actual file directly.

**Implementation Notes:**
* The endpoint directly streams the file contents using Express's `sendFile()`, not a base64 encoded string or JSON object.
* Supported file formats include SVG, PNG, and JPG, determined by file extension.
* If the credential exists but has no icon defined, a 404 error is returned.