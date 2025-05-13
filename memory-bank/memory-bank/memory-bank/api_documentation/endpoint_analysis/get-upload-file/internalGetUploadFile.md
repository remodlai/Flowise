# Endpoint Analysis: GET /api/v1/get-upload-file/{chatflowId}/{chatId}/{folderName}/{fileName}

**Module:** `get-upload-file`
**Operation ID:** `internalGetUploadFile`
**Description:** Serves a previously uploaded file directly from the file system. The path components identify the specific file within the storage structure.

**Key Files:**
* Router: `routes/get-upload-file/index.ts`
* Controller: `controllers/get-upload-file/index.ts` (Handler: `getUploadFile`)
* Utility: `getStoragePath` from `flowise-components` (used by controller to construct file path)

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `chatflowId` (string, required): ID of the chatflow.
*   `chatId` (string, required): ID of the chat session.
*   `folderName` (string, required): Folder name within the chat's storage (e.g., "fileloader").
*   `fileName` (string, required): Name of the file to retrieve.

**Responses:**
*   **`200 OK`:** File content is streamed. `Content-Type` is inferred.
*   **`400 Bad Request`:** If any path parameter is missing or invalid (e.g., path traversal).
*   **`404 Not Found`:** File not found at the constructed path.
*   **`500 Internal Server Error`**
