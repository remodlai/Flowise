# Endpoint Analysis: GET /api/v1/public-chatflows/{id}

**Module:** `public-chatflows`
**Operation ID:** `getSinglePublicChatflow`
**Description:** Retrieves a public chatflow by ID. This endpoint is used to access shared chatflows marked as public.

**Key Files:**
*   Router: `packages/server/src/routes/public-chatflows/index.ts`
*   Controller: `packages/server/src/controllers/chatflows/index.ts` (Handler: `getSinglePublicChatflow`)
*   Service: `packages/server/src/services/chatflows/index.ts` (Method: `getSinglePublicChatflow`)
*   Entity: `packages/server/src/database/entities/ChatFlow.ts`

**Authentication:** None (this is a public endpoint).

**Request:**
*   Method: `GET`
*   Path: `/api/v1/public-chatflows/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the chatflow to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the public chatflow.
    *   Content (`application/json`): The complete chatflow object including ID, name, flowData, and other properties.
*   **`401 Unauthorized`:**
    *   Description: Returned when the chatflow exists but is not marked as public.
*   **`404 Not Found`:**
    *   Description: `Chatflow` with the specified `id` not found.
    *   Content (`application/json`): Schema `$ref: '../../schemas/shared/CommonSchemas.yaml#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   Description: `id` (path parameter) not provided.
*   **`500 Internal Server Error`:**
    *   Description: Other server-side issues.

**Core Logic Summary:**
1. Controller validates `req.params.id`.
2. Calls `chatflowsService.getSinglePublicChatflow(id)`.
3. Service fetches the `ChatFlow` entity.
4. Service checks if the chatflow is marked as public (`isPublic` property).
5. If public, returns the complete chatflow object.
6. If not public, returns a 401 Unauthorized error.
7. If not found, returns a 404 Not Found error.

This endpoint is designed to provide access to complete chatflow information, but only for chatflows that have been explicitly marked as public. This enables public sharing of chatflow definitions while keeping other chatflows private. 