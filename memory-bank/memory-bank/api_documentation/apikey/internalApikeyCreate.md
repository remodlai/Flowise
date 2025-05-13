# Endpoint Analysis: POST /api/v1/apikey/

**Module:** `apikey`
**Operation ID:** `internalApikeyCreate`
**Description:** Creates a new API key and associated secret. The API key ID is derived from the first 20 characters of a new UUID. The API secret is hashed before being stored in the database, but the plaintext secret is returned once upon creation.

**Key Files:**
*   **Router:** `packages/server/src/routes/apikey/index.ts`
*   **Controller:** `packages/server/src/controllers/apikey/index.ts` (Handler: `createApiKey`)
*   **Service:** `packages/server/src/services/apikey/index.ts` (Method: `createApiKey`)
*   **Entity:** `packages/server/src/database/entities/ApiKey.ts`

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/apikey/`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Request Body Schema (`application/json`):**
    *   `keyName` (string, required): A descriptive name for the API key.
        *   *Example:* `"My Integration Key"`
*   **Example Request Body:**
    ```json
    {
      "keyName": "Remodl Platform Admin Key"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** API Key created successfully. **The `apiSecret` returned here is the only time the plaintext secret is available.**
    *   **Content (`application/json`):**
        *   Schema:
            *   `id` (string): The generated API key ID (first 20 chars of UUID).
            *   `keyName` (string): The name provided for the key.
            *   `apiKey` (string): The generated API key.
            *   `apiSecret` (string): The plaintext API secret. **Store this securely; it will not be retrievable again.**
        *   **Example Response Body:**
            ```json
            {
              "id": "a1b2c3d4e5f678901234",
              "keyName": "Remodl Platform Admin Key",
              "apiKey": "flow_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              "apiSecret": "SALT_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
            }
            ```
*   **`412 Precondition Failed`:**
    *   **Description:** `keyName` was not provided in the request body, or the body itself was missing.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'` (standard error object).
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred during key generation or database save.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates `req.body.keyName` presence.
2. Service generates a new UUID for `id` (truncated), a new API key, and a new API secret.
3. Service hashes the API secret for database storage.
4. Service creates and saves an `ApiKey` entity with `id`, `apiKey`, hashed `apiSecret`, and `keyName`.
5. Service returns the `id`, `keyName`, plaintext `apiKey`, and plaintext `apiSecret`.
6. Controller returns this object as JSON.
