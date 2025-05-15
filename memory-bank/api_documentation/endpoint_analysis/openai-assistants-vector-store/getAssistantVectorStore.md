# Get Assistant Vector Store

Retrieves a specific OpenAI vector store by ID.

## HTTP Method and Route

```
GET /api/v1/openai-assistants-vector-store/:id
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the vector store to retrieve. |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

## Response

### Success Response

Status Code: 200 OK

Response body contains the vector store object.

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
| 400 Precondition Failed | Missing or invalid ID parameter. |
| 400 Precondition Failed | Missing credential parameter. |
| 401 Unauthorized | Invalid or missing API key. |
| 404 Not Found | Vector store not found. |
| 404 Not Found | Credential not found. |
| 500 Internal Server Error | Server error. |

## Implementation Details

The endpoint calls the `getAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. Calls the OpenAI API to retrieve the vector store
5. Returns the vector store object

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access