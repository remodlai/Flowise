# Endpoint Analysis: GET /api/v1/credentials/{id}

**Module:** `credentials`
**Operation ID:** `internalCredentialsGetById`
**Description:** Retrieves a specific stored credential instance by its ID. The `encryptedData` is decrypted and returned in a `plainDataObj` field, while the `encryptedData` field itself is omitted from the response.

**Key Files:**
*   **Router:** `packages/server/src/routes/credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/credentials/index.ts` (Handler: `getCredentialById`)
*   **Service:** `packages/server/src/services/credentials/index.ts` (Method: `getCredentialById`)
*   **Entity:** `packages/server/src/database/entities/Credential.ts`
*   **Utility:** `../../utils/encryption.ts` (`decryptCredentialData`)
*   **Interface:** `../../Interface.ts` (`ICredentialReturnResponse`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/credentials/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the credential to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved and decrypted the credential.
    *   **Content (`application/json`):**
        *   Schema (`ICredentialReturnResponse` like):
            *   `id` (string, format: uuid)
            *   `name` (string)
            *   `credentialName` (string)
            *   `createdDate` (string, format: date-time)
            *   `updatedDate` (string, format: date-time)
            *   `plainDataObj` (object): The decrypted credential data (key-value pairs).
*   **`404 Not Found`:**
    *   **Description:** Credential with the specified `id` not found.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (path parameter) not provided.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Database, decryption, or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates `req.params.id`.
2. Calls service `getCredentialById(id)`.
3. Service fetches `Credential` by `id` from DB. Throws 404 if not found.
4. Decrypts `credential.encryptedData` using `decryptCredentialData`.
5. Constructs a response object containing original credential fields (omitting `encryptedData`) and adding the decrypted `plainDataObj`.
