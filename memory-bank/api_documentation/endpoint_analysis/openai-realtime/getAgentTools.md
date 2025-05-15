# Get Agent Tools

Retrieves the list of OpenAI function definitions for the tools available to an agent in a specific chatflow.

## HTTP Method and Route

```
GET /api/v1/openai-realtime/:id
```

or

```
GET /api/v1/openai-realtime/
```

## Authentication

No explicit authentication is required, but access is controlled through the chatflow ID.

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the chatflow containing the agent with tools. |

## Response

### Success Response

Status Code: 200 OK

Response body contains an array of OpenAI function definitions for the tools available to the agent.

Example response:
```json
[
  {
    "name": "get_current_weather",
    "description": "Get the current weather in a given location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state, e.g. San Francisco, CA"
        },
        "unit": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"]
        }
      },
      "required": ["location"]
    }
  },
  {
    "name": "search_database",
    "description": "Search the knowledge base for information",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "The search query"
        }
      },
      "required": ["query"]
    }
  }
]
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Precondition Failed | Missing or invalid ID parameter. |
| 404 Not Found | Chatflow not found or agent with tools not found in the chatflow. |
| 500 Internal Server Error | Server error. |

## Implementation Details

The endpoint calls the `getAgentTools` method of the `openaiRealTimeService`. This method:

1. Validates the chatflow ID
2. Retrieves the chatflow from the database
3. Locates the tool agent node in the chatflow
4. Initializes the agent node with the necessary environment
5. Retrieves the tools from the agent
6. Converts the tools to OpenAI function definitions using `convertToOpenAIFunction`
7. Returns the array of function definitions

## Technical Notes

- The endpoint requires the chatflow to contain a node of category "Agents" with inputs of type "Tool"
- The function definitions follow the OpenAI function calling format, which includes name, description, and parameters schema
- If the chatflow ID is not found or if the chatflow doesn't contain an agent with tools, a 404 error is returned