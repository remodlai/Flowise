# Endpoint Analysis: GET /api/v1/components-credentials-icon/{name} (and /)

**Module:** `components-credentials-icon`
**Operation ID:** `internalComponentsCredentialsIconGetByName`
**Description:** Retrieves the SVG icon for a specified credential component name. The icon is read from the file system (`packages/components/credentials/{name}/icon.svg`) and returned as a base64 encoded data URI string. The root path `/` will likely fail as the controller expects `req.params.name`.

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
    *   **Description:** Successfully retrieved the icon as a base64 data URI. Returns an empty string if the icon file does not exist.
    *   **Content (`application/json` - though service returns string, controller sends it as JSON):**
        *   Schema: `{ src: string }` (where `src` is the data URI `data:image/svg+xml;base64,...` or empty string).
*   **`412 Precondition Failed`:**
    *   **Description:** Credential name (`name`) not provided in the path.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Error reading the icon file or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller gets `credentialName` from `req.params.name`. Throws 412 if missing.
2. Calls service `getSingleComponentsCredentialIcon(credentialName)`.
3. Service constructs the file path: `packages/components/credentials/[credentialName]/icon.svg`.
4. Attempts to read the SVG file.
5. If successful, converts SVG content to a base64 data URI string.
6. If file doesn't exist or error, returns an empty string.
7. Controller returns `{ src: [dataUriOrEmptyString] }`.
