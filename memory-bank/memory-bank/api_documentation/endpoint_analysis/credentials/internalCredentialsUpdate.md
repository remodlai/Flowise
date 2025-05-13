# Endpoint Analysis: PUT /api/v1/credentials/{id}

**Module:** `credentials`
**Operation ID:** `internalCredentialsUpdate`
**Description:** Updates an existing stored credential instance. Allows updating the `name` and/or the `credentialData` (which will be re-encrypted). If `plainDataObj` is sent in the request body, it's merged with existing decrypted data before re-encryption.

**Key Files:**
*   **Router:** `packages/server/src/routes/credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/credentials/index.ts` (Handler: `updateCredential`)
*   **Service:** `packages/server/src/services/credentials/index.ts` (Method: `updateCredential`)
*   **Entity:** `packages/server/src/database/entities/Credential.ts`
*   **Utilities:** `../../utils/encryption.ts` (`decryptCredentialData`, `encrypt`), `transformToCredentialEntity`

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `PUT`
*   **Path:** `/api/v1/credentials/{id}` (The router also allows `PUT /` but controller requires `req.params.id`)
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the credential to update.
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema (`application/json`):**
    *   `name?` (string, optional): New user-defined name for the credential.
    *   `credentialName?` (string, optional): New type name (less common to change this post-creation).
    *   `credentialData?` (object, optional): Key-value pairs for the full new credential data. If provided, this completely replaces the old credential data before encryption.
    *   `plainDataObj?` (object, optional): Key-value pairs of credential data to update/merge with existing. If `credentialData` is also present, `credentialData` takes precedence for encryption. If only `plainDataObj` is present, its content is merged with existing decrypted data then re-encrypted.
*   **Example Request Body (Update name and one field in data):**
    ```json
    {
      "name": "My OpenAI Key - Updated",
      "plainDataObj": {
        "openAIApiKey": "sk-newapikeyvaluexxxxxxxxxxxx"
      }
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Credential updated successfully. Returns the updated `Credential` entity (with `encryptedData`).
    *   **Content (`application/json`):** Schema based on `Credential` entity.
*   **`404 Not Found`:**
    *   **Description:** Credential with the specified `id` not found.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (path parameter) or request body not provided.
*   **`500 Internal Server Error`:**
    *   **Description:** Database, encryption/decryption, or other server-side issue.

**Core Logic Summary:**
1. Controller validates `req.params.id` and `req.body`.
2. Calls service `updateCredential(id, body)`.
3. Service fetches `Credential` by `id`. Throws 404 if not found.
4. Decrypts existing `encryptedData`.
5. If `body.plainDataObj` exists, merges it with existing decrypted data. This merged object becomes the source for re-encryption if `body.credentialData` is not present.
6. `transformToCredentialEntity` is called with the request body. This function will use `body.credentialData` if present for encryption, otherwise it uses the (potentially merged) `body.plainDataObj`. It produces a new `encryptedData` string.
7. The service merges updated fields (e.g., `name` from body, new `encryptedData` from transform) into the fetched credential entity.
8. Saves the merged entity to the database. Returns the saved `Credential`.
