# Endpoint Analysis: POST /api/v1/attachments/:chatflowId/:chatId/

**Module:** `attachments`
**Operation ID:** `internalAttachmentsUpload`
**Description:** Uploads one or more files associated with a specific chat session within a chatflow. The files are processed, stored (likely on the filesystem or configured object storage), and their content (either base64 or extracted text) is returned along with metadata. Attachments are not stored as distinct database entities.

**Key Files:**
*   **Router:** `packages/server/src/routes/attachments/index.ts` (Defines `POST /`, but logic implies `/:chatflowId/:chatId/`)
*   **Controller:** `packages/server/src/controllers/attachments/index.ts` (Handler: `uploadAttachment`)
*   **Service:** `packages/server/src/services/attachments/index.ts` (Method: `createAttachment`)
*   **Utility:** `packages/server/src/utils/createAttachment.ts` (Function: `createFileAttachment`)
*   **Dependent Entity:** `packages/server/src/database/entities/ChatFlow.ts` (for validation)
*   **Component Used:** `fileLoader` node from `flowise-components`.

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/attachments/:chatflowId/:chatId/`
*   **Headers:**
    *   `Content-Type`: `multipart/form-data` (for file uploads)
*   **Path Parameters:**
    *   `chatflowId` (string, format: uuid, required): ID of the parent chatflow.
    *   `chatId` (string, format: uuid, required): ID of the specific chat session.
*   **Form Data:**
    *   Files: One or more files uploaded (e.g., field name `files`, `file`, `uploads[]` - depends on client, Multer handles `req.files`).
    *   `base64` (boolean, optional, in `req.body`): If `true`, the file content in the response will be a base64 encoded string. If `false` or omitted, the file content will be text extracted by the `fileLoader` node.
*   **Example (Conceptual form data):**
    *   File: `myDocument.pdf`
    *   Field `base64`: `true`

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Files processed successfully. Returns an array of attachment details.
    *   **Content (`application/json`):**
        *   Schema: Array of objects, each with:
            *   `name` (string): Original filename.
            *   `mimeType` (string): File MIME type.
            *   `size` (number): File size in bytes.
            *   `content` (string): Base64 encoded file content or extracted text content.
*   **`400 Bad Request`:**
    *   **Description:** Invalid `chatflowId` or `chatId` format, or path traversal attempt.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`404 Not Found`:**
    *   **Description:** `Chatflow` with the specified `chatflowId` not found.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Error during file processing, storage, or content extraction.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary (`createFileAttachment` utility):**
1. Validates `chatflowId` and `chatId` from path parameters.
2. Checks if the `ChatFlow` exists.
3. Iterates through files from `req.files` (multipart upload).
4. For each file:
    a. Saves file to storage (using `addArrayFilesToStorage` from `flowise-components`, path incorporates `chatflowId`, `chatId`).
    b. If `req.body.base64` is true, `content` becomes base64 of file buffer.
    c. Else, uses `fileLoader` node to process the stored file and get `pageContent`.
    d. Removes temporary uploaded file.
5. Returns an array of `{ name, mimeType, size, content }` objects.
