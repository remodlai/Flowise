# Endpoint Analysis: POST /api/v1/assistants/

**Module:** `assistants`
**Operation ID:** `internalAssistantsCreate`
**Description:** Creates a new Remodl Core Assistant.
- If `type` is "CUSTOM", creates a local assistant record.
- Otherwise (typically OpenAI or Azure type), it interacts with the OpenAI Assistants API to create or update an assistant, then stores its configuration in the Remodl Core database. The `details` field in the request body should be a JSON string representing the assistant's configuration. For OpenAI assistants, this mirrors OpenAI's Assistant object structure, including fields like `name`, `description`, `model`, `instructions`, `tools`, `tool_resources`, `temperature`, and `top_p`. Sensitive parts of `tool_resources` might be processed before sending to OpenAI.

**Key Files:**
*   **Router:** `packages/server/src/routes/assistants/index.ts`
*   **Controller:** `packages/server/src/controllers/assistants/index.ts` (Handler: `createAssistant`)
*   **Service:** `packages/server/src/services/assistants/index.ts` (Method: `createAssistant`)
*   **Entity:** `packages/server/src/database/entities/Assistant.ts`, `packages/server/src/database/entities/Credential.ts`
*   **Interface:** `packages/server/src/Interface.ts` (for `AssistantType`)

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism - typically admin/privileged).

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/assistants/`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Request Body Schema (`application/json`):**
    *   `details` (string, required): A JSON string containing the assistant's configuration.
        *   *For OpenAI-type assistants, this string should parse to an object like:*
            *   `id?` (string, optional): OpenAI Assistant ID. If provided, an update is attempted.
            *   `name?` (string): Assistant name.
            *   `description?` (string, nullable)
            *   `model` (string, required for new OpenAI assistant)
            *   `instructions?` (string, nullable)
            *   `tools?` (array of objects, e.g., `[{ "type": "code_interpreter" }, { "type": "file_search" }]`)
            *   `tool_resources?` (object, optional): Contains resources for tools like `code_interpreter` (`file_ids`) and `file_search` (`vector_store_ids`). Note: Structure sent to OpenAI API might be transformed for `vector_store_ids`.
            *   `temperature?` (number, nullable)
            *   `top_p?` (number, nullable)
    *   `credential` (string, format: uuid, required for non-CUSTOM type): ID of the credential (e.g., OpenAI API key) to use.
    *   `iconSrc?` (string, optional): URL for the assistant's icon.
    *   `type?` (string, enum from `AssistantType`, e.g., `OPENAI`, `CUSTOM`, `AZURE`): Type of assistant.
*   **Example Request Body (OpenAI type):**
    ```json
    {
      "details": "{\"name\":\"My New GPT-4 Assistant\",\"model\":\"gpt-4-turbo\",\"instructions\":\"You are a helpful bot.\",\"tools\":[{\"type\":\"code_interpreter\"}]}",
      "credential": "credential-uuid-for-openai",
      "type": "OPENAI"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Assistant created/updated successfully in Remodl Core and (if applicable) on OpenAI. Returns the Remodl Core `Assistant` entity.
    *   **Content (`application/json`):**
        *   Schema (based on `Assistant` entity):
            *   `id` (string, format: uuid): Remodl Core Assistant ID.
            *   `details` (string): JSON string of assistant configuration (includes OpenAI ID if applicable, and original `tool_resources`).
            *   `credential` (string, format: uuid): Credential ID used.
            *   `iconSrc?` (string, nullable)
            *   `type?` (string, `AssistantType` enum: "CUSTOM", "OPENAI", "AZURE")
            *   `createdDate` (string, format: date-time)
            *   `updatedDate` (string, format: date-time)
*   **`400 Bad Request` / `412 Precondition Failed`:**
    *   **Description:** Request body or required fields like `details` missing.
    *   **Content (`application/json`):** Schema `$ref: '../../schemas/shared/ErrorResponse.yaml#/components/schemas/ErrorResponse'` (standard error object).
*   **`404 Not Found`:**
    *   **Description:** Specified `credential` not found.
    *   **Content (`application/json`):** Schema `$ref: '../../schemas/shared/ErrorResponse.yaml#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Error interacting with OpenAI API, database error, or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '../../schemas/shared/ErrorResponse.yaml#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates `req.body`.
2. Service parses `req.body.details`.
3. If `type` is "CUSTOM", creates `Assistant` entity from `req.body` and saves to DB.
4. If OpenAI/Azure type:
    a. Retrieves and decrypts credential.
    b. Initializes OpenAI client.
    c. Prepares tools and tool_resources (transforming some for OpenAI API).
    d. If `details.id` (OpenAI ID) exists, updates OpenAI assistant.
    e. Else, creates new OpenAI assistant and gets its ID.
    f. Updates `req.body.details` with OpenAI ID and original tool_resources.
5. Creates `Assistant` entity from (potentially modified) `req.body` and saves to Remodl Core DB.
6. Sends telemetry. Returns saved `Assistant` entity.
