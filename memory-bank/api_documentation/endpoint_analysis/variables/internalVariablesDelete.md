# Endpoint Analysis: DELETE /api/v1/variables/{id}

**Module:** `variables`
**Operation ID:** `internalVariablesDelete`
**Description:** Deletes a global variable by its ID.

**Key Files:**
*   Router: `packages/server/src/routes/variables/index.ts`
*   Controller: `packages/server/src/controllers/variables/index.ts` (Handler: `deleteVariable`)
*   Service: `packages/server/src/services/variables/index.ts` (Method: `deleteVariable`)
*   Entity: `packages/server/src/database/entities/Variable.ts`

**Authentication:** Requires API Key.

**Request:**
*   Method: `DELETE`
*   Path: `/api/v1/variables/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the variable to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Variable deleted successfully.
    *   Content (`application/json`): TypeORM `DeleteResult` (e.g., `{ raw: [], affected: 1 }`).
*   **`412 Precondition Failed`:** `id` path parameter not provided.
*   **`500 Internal Server Error`:** Database error. 