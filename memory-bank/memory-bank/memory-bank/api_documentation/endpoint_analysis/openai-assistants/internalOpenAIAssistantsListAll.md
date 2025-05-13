# Endpoint Analysis: GET /api/v1/openai-assistants/

**Module:** `openai-assistants`
**Operation ID:** `internalOpenAIAssistantsListAll`
**Description:** Lists all OpenAI Assistants available under the provided OpenAI API key credential. This directly calls the OpenAI `beta.assistants.list()` API.

**Key Files:**
*   Router: `routes/openai-assistants/index.ts`
*   Controller: `controllers/openai-assistants/index.ts` (Handler: `getAllOpenaiAssistants`)
*   Service: `services/openai-assistants/index.ts` (Method: `getAllOpenaiAssistants`)
*   Entity: `database/entities/Credential.ts` (for retrieving OpenAI API key)
*   Schema: `OpenAIAssistantListResponse` (wrapper for `OpenAIAssistant` array, defined in `api_documentation/schemas/modules/openai_assistant_api/ListResponsesSchemas.yaml`)
*   Schema: `OpenAIAssistant` (defined in `api_documentation/schemas/modules/openai_assistant_api/AssistantSchemas.yaml`)

**Authentication:** Requires Remodl Core API Key. The operation itself uses an OpenAI credential specified by query parameter.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/openai-assistants/`
*   **Query Parameters:**
    *   `credential` (string, format: uuid, required): The ID of the Remodl Core credential entity that stores the OpenAI API key.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the list of OpenAI Assistants.
    *   Content (`application/json`): An OpenAI API list object containing an array of `OpenAIAssistant` objects.
        *   Example: `{ "object": "list", "data": [ { $ref: "#/components/schemas/OpenAIAssistant" }, ... ], "first_id": "...", "last_id": "...", "has_more": false }`
*   **`404 Not Found`:**
    *   Description: Specified `credential` not found in Remodl Core DB, or OpenAI API key missing from credential.
*   **`412 Precondition Failed`:**
    *   Description: `credential` query parameter not provided.
*   **`500 Internal Server Error`:** Error interacting with OpenAI API or other server-side issue.

**Core Logic Summary:**
1. Controller validates `req.query.credential`.
2. Calls service `getAllOpenaiAssistants(credentialId)`.
3. Service retrieves and decrypts the specified Remodl Core `Credential` to get the OpenAI API key.
4. Initializes OpenAI SDK client.
5. Calls `openai.beta.assistants.list()` and returns the `data` part of the OpenAI list response (the array of assistants).
