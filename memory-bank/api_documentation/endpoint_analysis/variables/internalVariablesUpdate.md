# Endpoint Analysis: PUT /api/v1/variables/{id}

**Module:** `variables`
**Operation ID:** `internalVariablesUpdate`
**Description:** Updates an existing global variable by its ID.

**Key Files:**
*   Router: `packages/server/src/routes/variables/index.ts`
*   Controller: `packages/server/src/controllers/variables/index.ts` (Handler: `updateVariable`)
*   Service: `packages/server/src/services/variables/index.ts` (Method: `updateVariable`)
*   Entity: `packages/server/src/database/entities/Variable.ts`
*   Schema File: `api_documentation/schemas/modules/VariablesSchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `PUT`
*   Path: `/api/v1/variables/{id}` or `/api/v1/variables/`
*   **Path Parameters:** (When using path version)
    *   `id` (string, format: uuid, required): ID of the variable to update.
*   **Request Body ID:** (When using root path version)
    *   If using the root path variant (`/api/v1/variables/`), the ID must be specified in the request body.
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema:** `$ref: '../../schemas/modules/VariablesSchemas.yaml#/components/schemas/VariableUpdateRequest'`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Variable updated successfully.
    *   Content (`application/json`): Schema `$ref: '../../schemas/modules/VariablesSchemas.yaml#/components/schemas/VariableSchema'`.
*   **`404 Not Found`:** Variable with the specified ID not found.
*   **`412 Precondition Failed`:** `id` or request body not provided.
*   **`500 Internal Server Error`:** Database error. 