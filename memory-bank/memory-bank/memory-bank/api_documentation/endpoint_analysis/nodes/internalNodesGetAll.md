# Endpoint Analysis: GET /api/v1/nodes/

**Module:** `nodes`
**Operation ID:** `internalNodesGetAll`
**Description:** Retrieves definitions for all available node components.

**Key Files:**
* Router: `routes/nodes/index.ts`
* Controller: `controllers/nodes/index.ts` (Handler: `getAllNodes`)
* Service: `services/nodes/index.ts` (Method: `getAllNodes`)
* Data Source: `appServer.nodesPool.componentNodes`

**Authentication:** Requires API Key.

**Responses:**
*   **`200 OK`:** Returns array of `NodeComponentDefinition` objects.
*   **`500 Internal Server Error`**
