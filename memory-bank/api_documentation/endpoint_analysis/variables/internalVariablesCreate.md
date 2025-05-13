# Endpoint Analysis: POST /api/v1/variables/

**Module:** `variables`
**Operation ID:** `internalVariablesCreate`
**Description:** Creates a new global variable in the database.

**Key Files:**
*   Router: `packages/server/src/routes/variables/index.ts`
*   Controller: `packages/server/src/controllers/variables/index.ts` (Handler: `createVariable`)
*   Service: `packages/server/src/services/variables/index.ts` (Method: `createVariable`)
*   Entity: `packages/server/src/database/entities/Variable.ts`
*   Schema File: `api_documentation/schemas/modules/VariablesSchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/variables/`
*   Headers: `Content-Type: application/json`
*   **Request Body Schema:** `$ref: '../../schemas/modules/VariablesSchemas.yaml#/components/schemas/VariableCreateRequest'`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Variable created successfully.
    *   Content (`application/json`): Schema `$ref: '../../schemas/modules/VariablesSchemas.yaml#/components/schemas/VariableSchema'`.
*   **`412 Precondition Failed`:** Request body not provided.
*   **`500 Internal Server Error`:** Database error.

**Core Logic Summary:**
1. Controller validates `req.body`.
2. Creates a new `Variable` instance and assigns properties from `req.body`.
3. Calls `variablesService.createVariable(newVariable)`.
4. Service saves the entity to the database.
5. Returns the saved `Variable` entity. 