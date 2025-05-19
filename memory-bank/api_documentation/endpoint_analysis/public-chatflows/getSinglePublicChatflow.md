# Endpoint Analysis: GET /api/v1/public-chatflows/{id}

**Module:** `public-chatflows`
**Operation ID:** `getSinglePublicChatflow`
**Description:** Retrieves a chatflow that has been marked as public by its ID. This endpoint is used to access shared chatflows and their flow definitions.

**Key Files:**
*   **Router:** `packages/server/src/routes/public-chatflows/index.ts`
*   **Controller:** `packages/server/src/controllers/chatflows/index.ts` (Handler: `getSinglePublicChatflow`)
*   **Service:** `packages/server/src/services/chatflows/index.ts` (Method: `getSinglePublicChatflow`)
*   **Entity:** `packages/server/src/database/entities/ChatFlow.ts`

**Authentication:** None (this is a public endpoint).

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/public-chatflows/{id}` or `/api/v1/public-chatflows/`
*   **Path Parameters:**
    *   `id` (string, format: uuid, optional): The ID of the chatflow to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the public chatflow.
    *   **Content (`application/json`):** The complete chatflow object including ID, name, flowData, and other properties. Schema: `$ref: '../../schemas/modules/ChatflowsSchemas.yaml#/components/schemas/ChatflowResponse'`
*   **`401 Unauthorized`:**
    *   **Description:** Returned when the chatflow exists but is not marked as public (`isPublic` flag is false).
    *   **Content (`application/json`):** Standard error response object.
*   **`404 Not Found`:**
    *   **Description:** `Chatflow` with the specified `id` not found.
    *   **Content (`application/json`):** Standard error response object.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` path parameter not provided when required.
    *   **Content (`application/json`):** Standard error response object.
*   **`500 Internal Server Error`:**
    *   **Description:** Other server-side issues.
    *   **Content (`application/json`):** Standard error response object.

**Core Logic Summary:**
1. Controller validates `req.params.id` is present.
2. Calls `chatflowsService.getSinglePublicChatflow(id)`.
3. Service fetches the `ChatFlow` entity from the database.
4. Service checks if the chatflow is marked as public (`isPublic` property).
5. If public, returns the complete chatflow object.
6. If not public, returns a 401 Unauthorized error.
7. If not found, returns a 404 Not Found error.

**Implementation Notes:**
* The endpoint is registered to handle both `'/'` and `'/:id'` paths, but the implementation requires the ID parameter.
* The controller will throw a 412 (Precondition Failed) error if no ID is provided.
* Unlike normal chatflow endpoints, this endpoint doesn't require authentication as it's designed for public access.
* Only chatflows that have been explicitly marked as public (by setting `isPublic: true`) can be accessed through this endpoint.
* This endpoint is used by the UI when accessing shared chatflows via public links. 