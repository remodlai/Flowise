# Delete Assistant Vector Store

Deletes an OpenAI vector store by ID.

## HTTP Method and Route

```
DELETE /api/v1/openai-assistants-vector-store/:id
```

or

```
DELETE /api/v1/openai-assistants-vector-store
```

## Authentication

Requires an OpenAI API key, provided via the `credential` query parameter.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the vector store to delete. Required in URL or in request body. |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | string | Yes | The ID of the credential containing the OpenAI API key. |

### Request Body (when using DELETE without ID in path)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | The ID of the vector store to delete. |

Example request body (when using DELETE without ID in path):
```json
{
  "id": "vs_abc123"
}
```

## Response

### Success Response

Status Code: 200 OK

Response body contains a confirmation of deletion.

Example response:
```json
{
  "id": "vs_abc123",
  "object": "vector_store.deleted",
  "deleted": true
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

The endpoint calls the `deleteAssistantVectorStore` method of the `openAIAssistantVectorStoreService`. This method:

1. Retrieves the credential from the database
2. Decrypts the credential data to get the OpenAI API key
3. Creates a new OpenAI client with the API key
4. Calls the OpenAI API to delete the vector store
5. Returns the deletion confirmation

## Security Considerations

- The OpenAI API key is stored encrypted in the database
- The API key is decrypted only when needed and never returned in responses
- The endpoint requires a valid credential ID to access