# Endpoint Analysis: GET /api/v1/leads/{chatflowid}

**Module:** `leads`

**Operation ID:** `internalLeadsGetAllByChatflowId`

**Description:** Retrieves all lead records associated with a specific chatflow ID.

**Key Files:**
*   **Router:** `packages/server/src/routes/leads/index.ts`
*   **Controller:** `packages/server/src/controllers/leads/index.ts` (Handler: `getAllLeadsForChatflow`)
*   **Service:** `packages/server/src/services/leads/index.ts` (Method: `getAllLeads`)
*   **Entity:** `packages/server/src/database/entities/Lead.ts`

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/leads/{chatflowid}`
*   **Path Parameters:**
    *   `chatflowid` (string, format: uuid, required): The ID of the chatflow to retrieve leads for. (Router path is `/:id`, controller uses `req.params.id` as `chatflowid`).

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved leads for the chatflow. Returns an array of `Lead` entities. Can be an empty array if no leads are found for the given chatflow ID.
    *   **Content (`application/json`):**
        *   Schema: Array of `Lead` objects (based on `Lead.ts` entity: `id`, `name?`, `email?`, `phone?`, `chatflowid`, `chatId`, `createdDate`).
*   **`412 Precondition Failed`:**
    *   **Description:** `chatflowid` (path parameter `:id`) not provided.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Database error or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller (`getAllLeadsForChatflow`) validates presence of `req.params.id` (as `chatflowid`).
2. Calls `leadsService.getAllLeads(chatflowid)`.
3. Service (`getAllLeads`) queries the database for all `Lead` entities matching the provided `chatflowid`.
4. Service returns the array of found `Lead` entities.
5. Controller returns this array as JSON.
