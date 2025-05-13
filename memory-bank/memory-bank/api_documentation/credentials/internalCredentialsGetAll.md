# Endpoint Analysis: GET /api/v1/credentials/

**Module:** `credentials`
**Operation ID:** `internalCredentialsGetAll`
**Description:** Retrieves all stored credential instances, or filters them by one or more `credentialName` (type of credential component).
- When retrieving ALL credentials (no `credentialName` filter), the `encryptedData` field is OMITTED from the response objects.
- When filtering by `credentialName`(s), the `encryptedData` field IS INCLUDED in the response objects.

**Key Files:**
*   **Router:** `packages/server/src/routes/credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/credentials/index.ts` (Handler: `getAllCredentials`)
*   **Service:** `packages/server/src/services/credentials/index.ts` (Method: `getAllCredentials`)
*   **Entity:** `packages/server/src/database/entities/Credential.ts`

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/credentials/`
*   **Query Parameters:**
    *   `credentialName` (string or array of string, optional): Filter by specific credential component type name(s) (e.g., "openAIApi").
        *   Example single: `?credentialName=openAIApi`
        *   Example multiple: `?credentialName=openAIApi&credentialName=azureOpenAIApi`

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved credentials.
    *   **Content (`application/json`):**
        *   Schema: Array of `Credential` objects (see `Credential.ts`).
            *   If `credentialName` query param was used, each object includes `id`, `name`, `credentialName`, `encryptedData`, `createdDate`, `updatedDate`.
            *   If no `credentialName` query param was used (get all), each object includes `id`, `name`, `credentialName`, `createdDate`, `updatedDate` (but `encryptedData` is omitted).
*   **`500 Internal Server Error`:**
    *   **Description:** Database error or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller calls service `getAllCredentials`, passing `req.query.credentialName`.
2. Service:
    a. If `paramCredentialName` is provided (string or array), fetches `Credential` entities from DB matching the type(s). Returns these including `encryptedData`.
    b. If `paramCredentialName` is not provided, fetches all `Credential` entities, but omits `encryptedData` from each before returning the array.
