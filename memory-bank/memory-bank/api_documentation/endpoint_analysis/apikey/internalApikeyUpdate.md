# Endpoint Analysis: PUT /api/v1/apikey/{id} (and /api/v1/apikey/)

**Module:** `apikey`
**Operation ID:** `internalApikeyUpdate`
**Description:** Updates the name (`keyName`) of an existing API key. The route can accept the ID in the path or (less commonly for PUT) expect it implicitly if a general update to a default/unspecified key is intended (though the controller logic prioritizes `req.params.id`).

**Key Files:**
*   **Router:** `packages/server/src/routes/apikey/index.ts`
*   **Controller:** `packages/server/src/controllers/apikey/index.ts` (Handler: `updateApiKey`)
*   **Service:** `packages/server/src/services/apikey/index.ts` (Method: `updateApiKey`)
*   **Entity:** `packages/server/src/database/entities/ApiKey.ts`

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `PUT`
*   **Path:** `/api/v1/apikey/{id}` (preferred) or `/api/v1/apikey/`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Path Parameters:**
    *   `id` (string, optional in route definition but effectively required by controller if path `/:id` is used): The ID of the API key to update.
*   **Request Body Schema (`application/json`):**
    *   `keyName` (string, required): The new descriptive name for the API key.
        *   *Example:* `"My Updated Integration Key"`
*   **Example Request Body:**
    ```json
    {
      "keyName": "Renamed Admin Key"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** API Key updated successfully. Returns the current list of all API keys.
    *   **Content (`application/json`):**
        *   Schema: Array of `ApiKeyWithCount` objects (same as `GET /apikey/` response).
*   **`404 Not Found`:**
    *   **Description:** `ApiKey` with the specified `id` not found (only in 'db' storage mode).
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (if path `/:id` used) or `keyName`/`req.body` was not provided.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates presence of `req.params.id` (if applicable) and `req.body.keyName`.
2. Service (`updateApiKey`) handles update based on `APIKEY_STORAGE_TYPE`:
    - 'json': Calls `updateAPIKey_json()` utility.
    - 'db': Finds `ApiKey` by `id`. If not found, throws 404. Updates `keyName` and saves.
3. Service returns the result of `getAllApiKeys()` (list of all keys with counts).
4. Controller returns this list as JSON.
