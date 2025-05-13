# Endpoint Analysis: GET /api/v1/public-chatbots/{id}

**Module:** `public-chatbots`
**Operation ID:** `getSinglePublicChatbotConfig`
**Description:** Retrieves the public configuration for a specific chatbot (which is a Flowise chatflow). This includes UI settings from the chatflow's `chatbotConfig`, file upload capabilities, and the raw `flowData`. This endpoint is used by the embedded chatbot UI.

**Key Files:**
*   Router: `packages/server/src/routes/public-chatbots/index.ts`
*   Controller: `packages/server/src/controllers/chatflows/index.ts` (Handler: `getSinglePublicChatbotConfig`)
*   Service: `packages/server/src/services/chatflows/index.ts` (Method: `getSinglePublicChatbotConfig`)
*   Utility: `packages/server/src/utils/getUploadsConfig.ts`
*   Entity: `packages/server/src/database/entities/ChatFlow.ts`
*   Schema File: `api_documentation/schemas/modules/PublicChatbotsSchemas.yaml` (for `PublicChatbotConfigResponse`)

**Authentication:** None (this is a public endpoint).

**Request:**
*   Method: `GET`
*   Path: `/api/v1/public-chatbots/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the chatflow to retrieve public config for.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the public chatbot configuration.
    *   Content (`application/json`): Schema: `PublicChatbotConfigResponse`. This can be an object containing various chatbot UI settings, upload configurations, and flow data, OR the string "OK" if no specific configuration is found.
*   **`404 Not Found`:**
    *   Description: `Chatflow` with the specified `id` not found.
    *   Content (`application/json`): Schema `$ref: '../../schemas/shared/CommonSchemas.yaml#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   Description: `id` (path parameter) not provided.
*   **`500 Internal Server Error`:**
    *   Description: Error parsing `chatbotConfig` or other server-side issue.

**Core Logic Summary:**
1. Controller validates `req.params.id`.
2. Calls `chatflowsService.getSinglePublicChatbotConfig(id)`.
3. Service fetches the `ChatFlow` entity.
4. Calls `utilGetUploadsConfig(id)` to determine file upload settings.
5. If `chatbotConfig` exists on the entity, it's parsed.
6. Returns a combined object of parsed `chatbotConfig`, `uploadsConfig`, and the raw `flowData` string. If neither `chatbotConfig` nor `uploadsConfig` is present, returns the string "OK".
