# Endpoint Analysis: GET /api/v1/get-upload-path/

**Module:** `get-upload-path`

**Operation ID:** `internalGetUploadPath`

**Description:** Returns the server's configured storage path for file uploads. This is used by the frontend to know the base path for uploads.

**Key Files:**
* Router: `routes/get-upload-path/index.ts`
* Controller: `controllers/get-upload-path/index.ts` (Handler: `getPathForUploads`)
* Function: `getStoragePath` from `flowise-components/src/storageUtils.ts` (used to retrieve the configured path)

**Authentication:** Requires API Key.

**Request Parameters:** None

**Responses:**
*   **`200 OK`:** Returns a JSON object with the storage path:
    ```json
    {
      "storagePath": "/app/flowise/uploads"
    }
    ```
    The path is determined based on:
    - The `BLOB_STORAGE_PATH` environment variable if set
    - Otherwise, defaults to `~/.flowise/storage` (user home directory)
    
*   **`500 Internal Server Error`:** If any error occurs during retrieval.
