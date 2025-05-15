# Endpoint Analysis: GET /api/v1/flow-config/{id}

**Module:** `flow-config`

**Operation ID:** `internalFlowConfigGetById`

**Description:** Retrieves specific UI/runtime configuration details for a chatflow, identified by its ID. Finds all available input parameter configurations from the chatflow's nodes.

**Key Files:**
* Router: `routes/flow-config/index.ts`
* Controller: `controllers/flow-configs/index.ts` (Handler: `getSingleFlowConfig`)
* Service: `services/flow-configs/index.ts` (Method: `getSingleFlowConfig`)
* Entity: `ChatFlow.ts` (as it retrieves flow data from this entity)
* Utility: `utils/index.ts` (Method: `findAvailableConfigs`)

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, required): The ID of the chatflow.

**Responses:**
*   **`200 OK`:** Returns an object containing available configuration details for all nodes in the chatflow. Each config object includes node name, nodeId, label, name, and type information.
*   **`404 Not Found`:** If chatflow with ID not found.
*   **`412 Precondition Failed`:** If ID is not provided.
*   **`500 Internal Server Error`:** If any error occurs during retrieval or processing.
