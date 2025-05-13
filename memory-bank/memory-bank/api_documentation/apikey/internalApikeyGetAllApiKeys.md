# Endpoint Analysis: GET /api/v1/apikey/

**Module:** `apikey`
**Operation ID:** `internalApikeyGetAllApiKeys`
**Description:** Retrieves all API keys, optionally filtered by `credentialName`. Returns keys with an added `chatflowCount`. Sensitive data like `encryptedData` is omitted.

**Key Files:**
*   **Router:** `packages/server/src/routes/apikey/index.ts`
*   **Controller:** `packages/server/src/controllers/apikey/index.ts` (Handler: `getAllApiKeys`)
*   **Service:** `packages/server/src/services/apikey/index.ts` (Method: `getAllApiKeys`)
*   **Entity:** `packages/server/src/database/entities/ApiKey.ts`
*   **Utility:** `../../utils/addChatflowsCount.ts`

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/apikey/`
*   **Query Parameters:**
    *   `credentialName` (string | array of string, optional): Filter the list of API keys by specific credential names. Can be a single name or an array of names.
        *   *Example:* `?credentialName=openAIApi` or `?credentialName[]=openAIApi&credentialName[]=serpApi`

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved API keys.
    *   **Content (`application/json`):**
        *   Schema: Array of `ApiKeyWithCount` objects.
            *   `ApiKeyWithCount` (extends `ApiKey` entity, omits `encryptedData`, adds `chatflowCount`):
                *   `id` (string, format: uuid)
                *   `keyName` (string)
                *   `apiKey` (string) - The actual API key value.
                *   `chatflowCount` (integer): Number of chatflows associated with this API key.
                *   `updatedDate` (string, format: date-time)
        *   **Example Response Body:**
            ```json
            [
              {
                "id": "a1b2c3d4e5f678901234",
                "keyName": "My OpenAI Key",
                "apiKey": "flow_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "chatflowCount": 3,
                "updatedDate": "2023-10-27T10:30:00.000Z"
              },
              {
                "id": "b2c3d4e5f678901234a1",
                "keyName": "DefaultKey",
                "apiKey": "flow_yyyyyyyyyyyyyyyyyyyyyyyyyyyy",
                "chatflowCount": 0,
                "updatedDate": "2023-10-26T09:00:00.000Z"
              }
            ]
            ```
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller receives optional `credentialName` query parameter.
2. Service retrieves API keys based on `APIKEY_STORAGE_TYPE`:
    - 'json': Uses `getAPIKeys_json()` utility.
    - 'db': Queries `ApiKey` entity, filtering by `credentialName` if provided. If no keys exist and no filter, creates a 'DefaultKey'.
3. Service calls `addChatflowsCount()` to annotate each key with the number of associated chatflows.
4. Service omits `encryptedData` from the returned key objects.
5. Controller returns the list of processed API key objects as JSON.
