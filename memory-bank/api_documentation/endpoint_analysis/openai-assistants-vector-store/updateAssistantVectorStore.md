# Update Assistant Vector Store

Updates an existing OpenAI vector store.

## HTTP Method and Route

```
PUT /api/v1/openai-assistants-vector-store/:id
```

or 

```
PUT /api/v1/openai-assistants-vector-store
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the vector store to update. Required in URL or in request body. |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | The new name of the vector store. |
| id | string | Yes (if not in path) | The ID of the vector store to update. |

Example request body (when using PUT without ID in path):
```json
{
  "id": "vs_abc123",
  "name": "Updated Vector Store Name"
}
```

Example request body (when using PUT with ID in path):
```json
{
  "name": "Updated Vector Store Name"
}
```

## Response

### Success Response

Status Code: 200 OK

Response body contains the updated vector store object, including details about any files attached to the vector store.

Example response:
```json
{
  "id": "vs_abc123",
  "object": "vector_store",
  "created_at": 1683057542,
  "name": "Updated Vector Store Name",
  "file_counts": {
    "total": 2,
    "completed": 2,
    "in_progress": 0,
    "failed": 0
  },
  "files": [
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
}
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Precondition Failed | Missing or invalid ID parameter. |
| 400 Precondition Failed | Missing credential parameter. |
| 400 Precondition Failed | Missing request body. |
| 401 Unauthorized | Invalid or missing API key. |
| 404 Not Found | Vector store not found. |
| 404 Not Found | Credential not found. |
| 500 Internal Server Error | Server error. |

## Implementation Details

The endpoint calls the `updateAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. Calls the OpenAI API to update the vector store
5. Retrieves the list of files associated with the vector store
6. Retrieves the details of each file
7. Returns the updated vector store object with file details

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access