# Endpoint Analysis: POST /api/v1/openai-assistants-files/download/

**Module:** `openai-assistants-files`
**Operation ID:** `internalOpenAIAssistantFilesDownload`
**Description:** Downloads a file that has been previously uploaded to OpenAI and associated with an assistant. The file is retrieved by chatflowId, chatId, and fileName parameters.

**Key Files:**
*   Router: `routes/openai-assistants-files/index.ts`
*   Controller: `controllers/openai-assistants/index.ts` (Handler: `getFileFromAssistant`)
*   Function: `streamStorageFile` from `flowise-components` (used to stream the file)

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/openai-assistants-files/download/`
*   Headers: `Content-Type: application/json`
*   Body:
    ```json
    {
      "chatflowId": "string",
      "chatId": "string",
      "fileName": "string"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   Description: File content is streamed with appropriate Content-Disposition header. The content type depends on the file being downloaded.
*   **`500 Internal Server Error`:** If any parameter is missing or the file cannot be streamed.

**Core Logic Summary:**
1. Controller validates the request body parameters: chatflowId, chatId, and fileName.
2. Sets the Content-Disposition header with the provided fileName.
3. Calls streamStorageFile to get a readable stream for the file.
4. Pipes the file stream directly to the response, or sends the file content if piping isn't possible. 