# Upload Files to Assistant Vector Store

Uploads files to an existing OpenAI vector store.

## HTTP Method and Route

```
POST /api/v1/openai-assistants-vector-store/:id
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the vector store to upload files to. |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

### Request Body

The request must be sent as `multipart/form-data` with the files to upload.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| files | file[] | Yes | One or more files to upload to the vector store. |

## Response

### Success Response

Status Code: 200 OK

Response body contains an array of the uploaded file objects.

Example response:
```json
[
  {
    "id": "file-abc123",
    "object": "file",
    "bytes": 15396,
    "created_at": 1683057500,
    "filename": "document1.pdf",
    "purpose": "assistants",
    "status": "processed",
    "status_details": null
  },
  {
    "id": "file-def456",
    "object": "file",
    "bytes": 25721,
    "created_at": 1683057520,
    "filename": "document2.pdf",
    "purpose": "assistants",
    "status": "processed",
    "status_details": null
  }
]
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Precondition Failed | Missing or invalid ID parameter. |
| 400 Precondition Failed | Missing credential parameter. |
| 400 Precondition Failed | Missing files. |
| 401 Unauthorized | Invalid or missing API key. |
| 404 Not Found | Vector store not found. |
| 404 Not Found | Credential not found. |
| 500 Internal Server Error | Server error, upload failed or was cancelled. |

## Implementation Details

The endpoint calls the `uploadFilesToAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. For each uploaded file:
   - Extracts the file from the request
   - Uploads the file to OpenAI with the purpose 'assistants'
   - Stores the file ID
5. Creates a file batch with all uploaded file IDs
6. Polls the file batch status until it's completed
7. Returns the array of uploaded file objects if all files are successfully processed
8. Removes the temporary files from the server

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access
- Temporary files are removed after upload to prevent storage bloat
- File names with special characters are properly handled to maintain encoding