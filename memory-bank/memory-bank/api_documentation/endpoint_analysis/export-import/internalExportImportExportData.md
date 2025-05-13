# Endpoint Analysis: POST /api/v1/export-import/export

**Module:** `export-import`
**Operation ID:** `internalExportImportExportData`
**Description:** Exports Remodl Core data including ChatFlows, Tools, Assistants, Credentials, Variables, and ApiKeys. Optionally includes ChatMessages and ChatMessageFeedback.

**Key Files:**
* Router: `routes/export-import/index.ts`
* Controller: `controllers/export-import/index.ts` (Handler: `exportData`)
* Service: `services/export-import/index.ts` (Method: `exportData`)

**Authentication:** Requires API Key.

**Request Body (`application/json`):**
*   `chatflowIds?` (array of string, optional): Specific chatflow IDs to export. If omitted, all chatflows are considered.
*   `includeMessages?` (boolean, optional, default: false): If true, associated chat messages and feedback are also exported.

**Responses:**
*   **`200 OK`:** Returns JSON object with keys like `ChatFlows`, `Tools`, `Assistants`, etc., each an array of the respective entities.
*   **`500 Internal Server Error`**
