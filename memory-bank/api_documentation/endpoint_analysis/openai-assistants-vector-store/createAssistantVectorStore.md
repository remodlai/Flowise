# Create Assistant Vector Store

Creates a new OpenAI vector store for use with assistants.

## HTTP Method and Route

```
POST /api/v1/openai-assistants-vector-store
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | The name of the vector store. |
| file_ids | string[] | No | Array of file IDs to be added to the vector store. |

Example request body:
```json
{
  "name": "My Vector Store",
  "file_ids": ["file-abc123", "file-def456"]
}
```

## Response

### Success Response

Status Code: 200 OK

Response body contains the created vector store object.

Example response:
```json
{
  "id": "vs_abc123",
  "object": "vector_store",
  "created_at": 1683057542,
  "name": "My Vector Store",
  "file_counts": {
    "total": 2,
    "completed": 2,
    "in_progress": 0,
    "failed": 0
  }
}
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Bad Request | Invalid request body. |
| 401 Unauthorized | Invalid or missing API key. |
| 404 Not Found | Credential not found. |
| 500 Internal Server Error | Server error. |

## Implementation Details

The endpoint calls the `createAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. Calls the OpenAI API to create a vector store
5. Returns the created vector store object

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access