# Delete Files from Assistant Vector Store

Deletes files from an existing OpenAI vector store.

## HTTP Method and Route

```
PATCH /api/v1/openai-assistants-vector-store/:id
```

or

```
PATCH /api/v1/openai-assistants-vector-store
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the vector store to delete files from. Required in URL or in request body. |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes (if not in path) | The ID of the vector store to delete files from. |
| file_ids | string[] | Yes | Array of file IDs to delete from the vector store. |

Example request body (when using PATCH with ID in path):
```json
{
  "file_ids": ["file-abc123", "file-def456"]
}
```

Example request body (when using PATCH without ID in path):
```json
{
  "id": "vs_abc123",
  "file_ids": ["file-abc123", "file-def456"]
}
```

## Response

### Success Response

Status Code: 200 OK

Response body contains a summary of the deleted files.

Example response:
```json
{
  "deletedFileIds": ["file-abc123", "file-def456"],
  "count": 2
}
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Precondition Failed | Missing or invalid ID parameter. |
| 400 Precondition Failed | Missing credential parameter. |
| 400 Precondition Failed | Missing request body or file_ids. |
| 401 Unauthorized | Invalid or missing API key. |
| 404 Not Found | Vector store not found. |
| 404 Not Found | Credential not found. |
| 500 Internal Server Error | Server error. |

## Implementation Details

The endpoint calls the `deleteFilesFromAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. For each file ID in the array:
   - Calls the OpenAI API to delete the file from the vector store
   - Tracks the deletion status
5. Returns a summary of the deletions, including:
   - An array of the successfully deleted file IDs
   - The count of successfully deleted files

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access