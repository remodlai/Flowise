# Endpoint Analysis: DELETE /api/v1/credentials/{id}

**Module:** `credentials`
**Operation ID:** `internalCredentialsDelete`
**Description:** Deletes a specific stored credential instance by its ID.

**Key Files:**
*   **Router:** `packages/server/src/routes/credentials/index.ts`
*   **Controller:** `packages/server/src/controllers/credentials/index.ts` (Handler: `deleteCredentials`)
*   **Service:** `packages/server/src/services/credentials/index.ts` (Method: `deleteCredentials`)
*   **Entity:** `packages/server/src/database/entities/Credential.ts`

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `DELETE`
*   **Path:** `/api/v1/credentials/{id}` (The router also allows `DELETE /` but controller requires `req.params.id`)
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the credential to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Credential deleted successfully.
    *   **Content (`application/json`):** TypeORM `DeleteResult` (e.g., `{ raw: [], affected: 1 }`).
*   **`404 Not Found`:**
    *   **Description:** Credential with the specified `id` not found (or delete operation affected 0 rows).
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (path parameter) not provided.
*   **`500 Internal Server Error`:**
    *   **Description:** Database error.

**Core Logic Summary:**
1. Controller validates `req.params.id`.
2. Calls service `deleteCredentials(id)`.
3. Service attempts to delete the `Credential` by `id` from the database.
4. Returns the TypeORM `DeleteResult`.
