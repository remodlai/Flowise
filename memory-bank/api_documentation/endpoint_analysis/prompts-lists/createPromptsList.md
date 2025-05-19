# API Endpoint Analysis: `POST /prompts-list`

**Task ID:** `b921b6cc-a76a-4731-877f-4e2f8e7eced6`
**Module:** `prompts-lists`
**Operation ID:** `createPromptsList`
**Source Files:**
*   `packages/server/src/routes/prompts-lists/index.ts`
*   `packages/server/src/controllers/prompts-lists/index.ts`
*   `packages/server/src/services/prompts-lists/index.ts`

## Endpoint Description

Fetches a list of prompt repositories from the public Langchain Hub API (`api.hub.langchain.com`). Allows optional filtering by tags.

## Request Details

*   **Method:** `POST`
*   **Path:** `/prompts-list`
*   **Content-Type:** `application/json`
*   **Request Body Schema:** `$ref: '../../schemas/modules/PromptsListsSchemas.yaml#/components/schemas/PromptsListRequestBody'`
    *   `tags` (string, optional): Comma-separated tags for filtering.

## Response Details

*   **Success Response (`application/json`):**
    *   **Status Code:** `200 OK`
    *   **Schema:** `$ref: '../../schemas/modules/PromptsListsSchemas.yaml#/components/schemas/PromptsListSuccessResponse'`
    *   **Contains:** `status: "OK"` and `repos`: an array of Langchain Hub repository objects (`LangchainHubRepo`).
*   **Service Error Response (`application/json`):**
    *   **Status Code:** `200 OK` (Note: The controller returns 200 even if the service indicates an error)
    *   **Schema:** `$ref: '../../schemas/modules/PromptsListsSchemas.yaml#/components/schemas/PromptsListServiceErrorResponse'`
    *   **Contains:** `status: "ERROR"` and `repos: []`. This occurs if the call to the Langchain Hub API fails.
*   **Other Error Responses (`application/json`):**
    *   **Status Code:** `500 Internal Server Error` (If an unexpected error occurs in the controller).
    *   **Schema:** `$ref: '../../schemas/shared/ErrorResponse.yaml#/components/schemas/ErrorResponse'`

## Processing Logic Summary

1.  The controller receives the request body.
2.  The controller calls the `promptsListsService.createPromptsList` method, passing the request body.
3.  The service constructs a URL for the Langchain Hub API, incorporating the optional `tags` parameter and default query parameters (`limit=100`, sorting, etc.).
4.  The service uses `axios.get` to fetch data from the Langchain Hub.
5.  If the fetch is successful and returns data, the service formats a success response (`{ status: 'OK', repos: [...] }`).
6.  If the fetch fails, the service formats a specific error response (`{ status: 'ERROR', repos: [] }`).
7.  The controller returns the service's response directly as JSON with a `200 OK` status.

## Security & Authorization

*   Access to this endpoint requires an API key via the standard ApiKeyAuth middleware that is applied to all internal API endpoints.

## Implementation Notes

*   Despite the POST method, this endpoint doesn't create anything in the Flowise database - it simply proxies a request to Langchain Hub's API.
*   The service handles errors from the Langchain Hub API by returning a 200 OK response with a specific error format, rather than propagating a standard error.
*   The service has a TODO comment regarding adding pagination support and using offset & limit parameters.
