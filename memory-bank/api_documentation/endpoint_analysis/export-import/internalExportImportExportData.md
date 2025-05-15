# Endpoint Analysis: POST /api/v1/export-import/export

**Module:** `export-import`
**Operation ID:** `internalExportImportExportData`
**Description:** Exports various types of Remodl Core data including Chatflows, Agent Flows, Assistants, Tools, Variables, and more based on the specified options.

**Key Files:**
* Router: `routes/export-import/index.ts`
* Controller: `controllers/export-import/index.ts` (Handler: `exportData`)
* Service: `services/export-import/index.ts` (Method: `exportData`, `convertExportInput`)

**Authentication:** Requires API Key authentication.

**Request Body (`application/json`):**
*   `agentflow` (boolean, optional): Whether to include agent flows in the export.
*   `agentflowv2` (boolean, optional): Whether to include agent flows v2 in the export.
*   `assistantCustom` (boolean, optional): Whether to include custom assistants in the export.
*   `assistantOpenAI` (boolean, optional): Whether to include OpenAI assistants in the export.
*   `assistantAzure` (boolean, optional): Whether to include Azure assistants in the export.
*   `chatflow` (boolean, optional): Whether to include chatflows in the export.
*   `chat_message` (boolean, optional): Whether to include chat messages in the export.
*   `chat_feedback` (boolean, optional): Whether to include chat feedback in the export.
*   `custom_template` (boolean, optional): Whether to include custom templates in the export.
*   `document_store` (boolean, optional): Whether to include document stores in the export.
*   `execution` (boolean, optional): Whether to include executions in the export.
*   `tool` (boolean, optional): Whether to include tools in the export.
*   `variable` (boolean, optional): Whether to include variables in the export.

**Responses:**
*   **`200 OK`:** Returns a JSON object containing the requested data with a default file name recommendation. The response includes arrays of the requested entity types (e.g., `AgentFlow`, `ChatFlow`, `Tool`, etc.)
*   **`500 Internal Server Error`:** If there's an error during export processing.
