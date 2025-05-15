# Endpoint Analysis: POST /api/v1/export-import/import

**Module:** `export-import`
**Operation ID:** `internalExportImportImportData`
**Description:** Imports Remodl Core data. Expects the same structure as produced by the export endpoint, handling duplicate records by generating new IDs.

**Key Files:**
* Router: `routes/export-import/index.ts`
* Controller: `controllers/export-import/index.ts` (Handler: `importData`)
* Service: `services/export-import/index.ts` (Method: `importData`)

**Authentication:** Requires API Key authentication.

**Request Body (`application/json`):**
* Expects the same structure as the export endpoint response:
  * `FileDefaultName` (string): Default filename for the exported data.
  * `AgentFlow` (array): Array of agent flow configurations to import.
  * `AgentFlowV2` (array): Array of agent flow v2 configurations to import.
  * `AssistantCustom` (array): Array of custom assistants to import.
  * `AssistantFlow` (array): Array of assistant flows to import.
  * `AssistantOpenAI` (array): Array of OpenAI assistants to import.
  * `AssistantAzure` (array): Array of Azure assistants to import.
  * `ChatFlow` (array): Array of chatflows to import.
  * `ChatMessage` (array): Array of chat messages to import.
  * `ChatMessageFeedback` (array): Array of chat message feedback to import.
  * `CustomTemplate` (array): Array of custom templates to import.
  * `DocumentStore` (array): Array of document stores to import.
  * `DocumentStoreFileChunk` (array): Array of document store file chunks to import.
  * `Execution` (array): Array of executions to import.
  * `Tool` (array): Array of tools to import.
  * `Variable` (array): Array of variables to import.

**Responses:**
*   **`200 OK`:** Returns `{ message: 'success' }` upon successful import.
*   **`400 Bad Request`:** If the request body is missing or invalid.
*   **`500 Internal Server Error`:** If there's an error during the import process.
