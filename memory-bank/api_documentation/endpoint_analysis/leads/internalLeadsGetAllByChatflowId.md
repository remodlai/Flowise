# Endpoint Analysis: GET /api/v1/leads/{chatflowid}

**Module:** `leads`

**Operation ID:** `internalLeadsGetAllByChatflowId`

**Description:** Retrieves all lead records associated with a specific chatflow ID.

**Key Files:**
*   **Router:** `packages/server/src/routes/leads/index.ts`
*   **Controller:** `packages/server/src/controllers/leads/index.ts` (Handler: `getAllLeadsForChatflow`)
*   **Service:** `packages/server/src/services/leads/index.ts` (Method: `getAllLeads`)
*   **Entity:** `packages/server/src/database/entities/Lead.ts`
*   **Interface:** `packages/server/src/Interface.ts` (Interface: `ILead`)

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
        *   Schema: Array of `Lead` objects with the following properties:
            * `id` (string, uuid): Unique identifier of the lead record.
            * `name?` (string, optional): Name of the lead.
            * `email?` (string, optional): Email address of the lead.
            * `phone?` (string, optional): Phone number of the lead.
            * `chatflowid` (string): ID of the chatflow where the lead was captured.
            * `chatId` (string): ID of the specific chat session that generated the lead.
            * `createdDate` (string, date-time): Timestamp when the lead was created.
*   **`412 Precondition Failed`:**
    *   **Description:** `chatflowid` (path parameter `:id`) not provided.
    *   **Content (`application/json`):** Error response with message about missing ID.
*   **`500 Internal Server Error`:**
    *   **Description:** Database error or other server-side issue.
    *   **Content (`application/json`):** Error response with details about the issue.

**Core Logic Summary:**
1. Controller (`getAllLeadsForChatflow`) validates presence of `req.params.id` (as `chatflowid`).
2. If chatflowid is missing, returns a 412 error with appropriate message.
3. Calls `leadsService.getAllLeads(chatflowid)`.
4. Service (`getAllLeads`) queries the database for all `Lead` entities matching the provided `chatflowid`.
5. Service returns the array of found `Lead` entities (can be empty if none found).
6. Controller returns this array as JSON.

**Implementation Notes:**
* This endpoint is used internally to retrieve all leads for a specific chatflow, typically for admin or analytics purposes.
* The implementation follows a standard controller-service pattern with separation of concerns.
* Error handling is implemented at both controller and service levels.
