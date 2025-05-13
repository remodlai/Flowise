# Endpoint Analysis: DELETE /api/v1/apikey/{id} (and /api/v1/apikey/)

**Module:** `apikey`
**Operation ID:** `internalApikeyDelete`
**Description:** Deletes an API key specified by ID. The route can accept the ID in the path.

**Key Files:**
*   **Router:** `packages/server/src/routes/apikey/index.ts`
*   **Controller:** `packages/server/src/controllers/apikey/index.ts` (Handler: `deleteApiKey`)
*   **Service:** `packages/server/src/services/apikey/index.ts` (Method: `deleteApiKey`)
*   **Entity:** `packages/server/src/database/entities/ApiKey.ts`

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `DELETE`
*   **Path:** `/api/v1/apikey/{id}` (preferred) or `/api/v1/apikey/`
*   **Path Parameters:**
    *   `id` (string, required): The ID of the API key to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** API Key deleted successfully. Returns the current list of all API keys.
    *   **Content (`application/json`):**
        *   Schema: Array of `ApiKeyWithCount` objects (same as `GET /apikey/` response).
*   **`404 Not Found`:**
    *   **Description:** `ApiKey` with the specified `id` not found (more likely if 'json' storage type is used and ID doesn't match; 'db' mode doesn't explicitly throw 404 here but might effectively return an unchanged list if ID was invalid).
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` was not provided in the path.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates presence of `req.params.id`.
2. Service (`deleteApiKey`) handles deletion based on `APIKEY_STORAGE_TYPE`:
    - 'json': Calls `deleteAPIKey_json()` utility.
    - 'db': Deletes `ApiKey` by `id` using TypeORM.
3. Service returns the result of `getAllApiKeys()` (list of all remaining keys with counts).
4. Controller returns this list as JSON.
