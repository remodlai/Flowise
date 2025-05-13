# Endpoint Analysis: GET /api/v1/flow-config/{id}

**Module:** `flow-config`
**Operation ID:** `internalFlowConfigGetById`
**Description:** Retrieves specific UI/runtime configuration details for a chatflow, identified by its ID. This often includes chatbotConfig, speechToText, and uploadsConfig.

**Key Files:**
* Router: `routes/flow-config/index.ts`
* Controller: `controllers/flow-configs/index.ts` (Handler: `getSpecificFlowConfig`)
* Service: `services/flow-configs/index.ts` (Method: `getSpecificFlowConfig`)
* Entity: `ChatFlow.ts` (as it reads `chatbotConfig`, `speechToText` from it)
* Utility: `utils/getUploadsConfig.ts`

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, required): The ID of the chatflow.

**Responses:**
*   **`200 OK`:** Returns an object containing `chatbotConfig` (parsed JSON or {}), `speechToText` (parsed JSON or {}), and `uploadsConfig` (from `utilGetUploadsConfig`).
*   **`404 Not Found`:** If chatflow with ID not found.
*   **`412 Precondition Failed`:** If ID is not provided.
*   **`500 Internal Server Error`**
