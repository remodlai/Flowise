# Endpoint Analysis: GET /api/v1/openai-assistants/{id}

**Module:** `openai-assistants`
**Operation ID:** `internalOpenAIAssistantsGetById`
**Description:** Retrieves a specific OpenAI Assistant by its ID, using the provided OpenAI API key credential. The response is enriched: `tool_resources.code_interpreter.files` and `tool_resources.file_search.files` arrays are populated with full `OpenAIFileObject` details, and `tool_resources.file_search.vector_store_object` with the `OpenAIVectorStore` object.

**Key Files:**
*   Router: `routes/openai-assistants/index.ts`
*   Controller: `controllers/openai-assistants/index.ts` (Handler: `getSingleOpenaiAssistant`)
*   Service: `services/openai-assistants/index.ts` (Method: `getSingleOpenaiAssistant`)
*   Entity: `database/entities/Credential.ts`
*   Schemas: `OpenAIAssistant`, `OpenAIFileObject`, `OpenAIVectorStore` (in `api_documentation/schemas/modules/openai_assistant_api/`)

**Authentication:** Remodl Core API Key. Uses specified OpenAI credential.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/openai-assistants/{id}`
*   **Path Parameters:**
    *   `id` (string, required): The ID of the OpenAI Assistant to retrieve.
*   **Query Parameters:**
    *   `credential` (string, format: uuid, required): Remodl Core credential ID for OpenAI API key.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved and enriched the OpenAI Assistant.
    *   Content (`application/json`): An `OpenAIAssistant` object, where `tool_resources.code_interpreter` may have an added `files` array (of `OpenAIFileObject`s) and `tool_resources.file_search` may have an added `files` array and a `vector_store_object` (`OpenAIVectorStore`).
*   **`404 Not Found`:** Credential or OpenAI Assistant not found.
*   **`412 Precondition Failed`:** `id` or `credential` missing.
*   **`500 Internal Server Error`:** OpenAI API error.

**Core Logic Summary:**
1. Controller validates `req.params.id` and `req.query.credential`.
2. Calls service `getSingleOpenaiAssistant(credentialId, assistantId)`.
3. Service gets OpenAI API key from credential.
4. Retrieves assistant via `openai.beta.assistants.retrieve(assistantId)`.
5. If `tool_resources.code_interpreter.file_ids` exist, lists all OpenAI files, filters them by these IDs, and adds to response as `tool_resources.code_interpreter.files`.
6. If `tool_resources.file_search.vector_store_ids` exist, lists files for that vector store, lists all OpenAI files, filters by vector store file IDs, and adds to response as `tool_resources.file_search.files`. Also retrieves and adds the vector store object itself as `tool_resources.file_search.vector_store_object`.
7. Returns the enriched Assistant object.
