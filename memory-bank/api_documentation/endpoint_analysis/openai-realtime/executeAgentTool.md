# Execute Agent Tool

Executes a specific tool from an agent in a chatflow and returns the results.

## HTTP Method and Route

```
POST /api/v1/openai-realtime/:id
```

or

```
POST /api/v1/openai-realtime/
```

## Authentication

No explicit authentication is required, but access is controlled through the chatflow ID.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the chatflow containing the agent with tools. |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chatId | string | Yes | The ID of the chat session. Used to maintain context across tool executions. |
| toolName | string | Yes | The name of the tool to execute, matching one of the tool names from the getAgentTools endpoint. |
| inputArgs | object | Yes | The arguments to pass to the tool, following the schema defined in the tool's parameters. |
| apiMessageId | string | No | Optional ID for the API message. If not provided, a UUID will be generated. |

Example request body:
```json
{
  "chatId": "chat_123456789",
  "toolName": "get_current_weather",
  "inputArgs": {
    "location": "San Francisco, CA",
    "unit": "celsius"
  },
  "apiMessageId": "msg_987654321"
}
```

## Response

### Success Response

Status Code: 200 OK

Response body contains the output from the tool execution, along with any source documents and artifacts.

Example response:
```json
{
  "output": "The current temperature in San Francisco, CA is 18°C with partly cloudy skies. The humidity is 65% and wind speed is 10 km/h from the west.",
  "sourceDocuments": [],
  "artifacts": []
}
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Precondition Failed | Missing or invalid ID parameter. |
| 400 Precondition Failed | Missing or invalid request body, chatId, toolName, or inputArgs. |
| 404 Not Found | Chatflow not found, agent with tools not found in the chatflow, or specific tool not found. |
| 500 Internal Server Error | Server error during tool execution. |

## Implementation Details

The endpoint calls the `executeAgentTool` method of the `openaiRealTimeService`. This method:

1. Validates the chatflow ID, chatId, toolName, and inputArgs
2. Retrieves the chatflow from the database
3. Initializes the agent node with the necessary environment and chat context
4. Finds the specific tool by name from the agent's tools array
5. Executes the tool with the provided input arguments
6. Processes the tool output, including extracting any source documents or artifacts
7. Returns the output, source documents, and artifacts

## Technical Notes

- The request must include a chatId to maintain context across multiple tool executions
- The toolName must match one of the tool names returned by the getAgentTools endpoint
- The inputArgs must follow the schema defined in the tool's parameters
- The response may include sourceDocuments if the tool execution retrieved information from documents
- The response may include artifacts if the tool execution generated any additional data
- Special markers (SOURCE_DOCUMENTS_PREFIX and ARTIFACTS_PREFIX) are used in the tool output to separate the actual output from source documents and artifacts