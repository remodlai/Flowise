# Endpoint Analysis: GET /api/v1/get-upload-file/

**Module:** `get-upload-file`

**Operation ID:** `internalGetUploadFile`

**Description:** Serves a previously uploaded file directly from the file system based on query parameters.

**Key Files:**
* Router: `routes/get-upload-file/index.ts`
* Controller: `controllers/get-upload-file/index.ts` (Handler: `streamUploadedFile`)
* Function: `streamStorageFile` from `flowise-components` (used to retrieve file stream)

**Authentication:** Requires API Key.

**Query Parameters:**
*   `chatflowId` (string, required): ID of the chatflow.
*   `chatId` (string, required): ID of the chat session.
*   `fileName` (string, required): Name of the file to retrieve.

**Responses:**
*   **`200 OK`:** File content is streamed with appropriate Content-Disposition header. The content type will vary based on the file.
*   **`500 Internal Server Error`:** If any parameter is missing or file cannot be streamed.
