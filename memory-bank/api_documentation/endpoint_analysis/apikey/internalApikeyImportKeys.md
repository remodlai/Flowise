# Endpoint Analysis: POST /api/v1/apikey/import

**Module:** `apikey`
**Operation ID:** `internalApikeyImportKeys`
**Description:** Imports API keys from a JSON file (provided as a data URI). Supports different import modes for handling existing keys: replace all, error if exists, overwrite if exists, or ignore if exists.

**Key Files:**
*   **Router:** `packages/server/src/routes/apikey/index.ts`
*   **Controller:** `packages/server/src/controllers/apikey/index.ts` (Handler: `importKeys`)
*   **Service:** `packages/server/src/services/apikey/index.ts` (Method: `importKeys`)
*   **Entity:** `packages/server/src/database/entities/ApiKey.ts`
*   **Utilities:** `../../utils/apiKey.ts` (for JSON storage mode)

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/apikey/import`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Request Body Schema (`application/json`):**
    *   `jsonFile` (string, required): A data URI representing the JSON file content. Must be in the format `data:application/json;base64,[base64EncodedJsonString]`. The JSON string itself should be an array of API key objects.
        *   Each API key object in the array should conform to:
            *   `id` (string, required): API key ID.
            *   `apiKey` (string, required): The API key value.
            *   `apiSecret` (string, required): The hashed API secret (if importing into DB mode directly) or plaintext secret if the underlying JSON utilities handle hashing.
            *   `keyName` (string, required): Descriptive name for the key.
    *   `importMode` (string, optional, default: varies by internal logic, likely 'overwriteIfExist' or 'errorIfExist' if not specified for DB mode): Specifies how to handle conflicts with existing keys.
        *   Enum: `["replaceAll", "errorIfExist", "overwriteIfExist", "ignoreIfExist"]`
*   **Example Request Body:**
    ```json
    {
      "jsonFile": "data:application/json;base64,W3siaWQiOiJhMWIyYzNkNGU1ZjY3ODkwMTIzNCIsImFwaUtleSI6ImZsb3dfeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgiLCJhcGlTZWNyZXQiOiJIQVNIRURfU0VDUkVUIiwia2V5TmFtZSI6IkltcG9ydGVkS2V5MSJ9XQ==",
      "importMode": "overwriteIfExist"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** API Keys imported successfully. Returns the current list of all API keys after the import operation.
    *   **Content (`application/json`):**
        *   Schema: Array of `ApiKey` objects (as defined for `POST /apikey/` response, but `apiSecret` will be the hashed version from DB).
*   **`412 Precondition Failed`:**
    *   **Description:** Request body or `jsonFile` was not provided.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Invalid dataURI, JSON parsing error, error during database operation, or "Key with name X already exists" (if `importMode` is `errorIfExist`).
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates `req.body.jsonFile` presence.
2. Service decodes base64 `jsonFile` content and parses it as a JSON array of API key objects.
3. Based on `APIKEY_STORAGE_TYPE` (env var):
    - If 'json': Calls utility `replaceAllAPIKeys_json` or `importKeys_json`.
    - If 'db':
        - Handles `importMode` ("replaceAll" deletes existing keys; "errorIfExist" pre-checks for duplicates).
        - Iterates through imported keys, applying `importMode` logic (overwrite, ignore, or add new) to the database.
4. Service returns the result of `getAllApiKeys()`.
