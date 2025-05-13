# Endpoint Analysis: POST /api/v1/credentials/

**Module:** `credentials`
**Operation ID:** `internalCredentialsCreate`
**Description:** Creates a new stored credential instance. The actual credential data is encrypted before saving.

**Key Files:**
*   **Router:** `packages/server/src/routes/credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/credentials/index.ts` (Handler: `createCredential`)
*   **Service:** `packages/server/src/services/credentials/index.ts` (Method: `createCredential`)
*   **Entity:** `packages/server/src/database/entities/Credential.ts`
*   **Utility:** `../../utils/encryption.ts` (`encrypt`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/credentials/`
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema (`application/json`):**
    *   `name` (string, required): User-defined name for this credential instance (e.g., "My OpenAI Key").
    *   `credentialName` (string, required): The type name of the credential component (e.g., "openAIApi").
    *   `credentialData` (object, required): Key-value pairs for the credential parameters (e.g., `{"openAIApiKey": "sk-..."}`). This object is stringified then encrypted.
*   **Example Request Body:**
    ```json
    {
      "name": "My Personal OpenAI",
      "credentialName": "openAIApi",
      "credentialData": {
        "openAIApiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
    ```

**Responses:**
*   **`200 OK` (Success):**
    *   **Description:** Credential created successfully. Returns the created `Credential` entity (with `encryptedData`).
    *   **Content (`application/json`):** Schema based on `Credential` entity.
*   **`412 Precondition Failed`:** Missing `name`, `credentialName`, or `credentialData` in body.
*   **`500 Internal Server Error`:** Database or encryption error.

**Core Logic Summary:**
1. Controller validates `req.body` for required fields.
2. Calls service `createCredential(body)`.
3. Service encrypts `JSON.stringify(body.credentialData)`.
4. Creates new `Credential` entity with `name`, `credentialName`, and `encryptedData`.
5. Saves to database. Returns saved entity.
