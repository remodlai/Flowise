# List Assistant Vector Stores

Retrieves a list of all OpenAI vector stores associated with the API key.

## HTTP Method and Route

```
GET /api/v1/openai-assistants-vector-store
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

## Response

### Success Response

Status Code: 200 OK

Response body contains an array of vector store objects.

Example response:
```json
[
  {
    "id": "vs_abc123",
    "object": "vector_store",
    "created_at": 1683057542,
    "name": "My Vector Store 1",
    "file_counts": {
      "total": 2,
      "completed": 2,
      "in_progress": 0,
      "failed": 0
    }
  },
  {
    "id": "vs_def456",
    "object": "vector_store",
    "created_at": 1683057600,
    "name": "My Vector Store 2",
    "file_counts": {
      "total": 3,
      "completed": 3,
      "in_progress": 0,
      "failed": 0
    }
  }
]
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Precondition Failed | Missing credential parameter. |
| 401 Unauthorized | Invalid or missing API key. |
| 404 Not Found | Credential not found. |
| 500 Internal Server Error | Server error. |

## Implementation Details

The endpoint calls the `listAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. Calls the OpenAI API to list vector stores
5. Returns the data array from the response

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access