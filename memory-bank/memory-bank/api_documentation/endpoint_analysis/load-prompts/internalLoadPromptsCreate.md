# Endpoint Analysis: POST /api/v1/load-prompt/

**Module:** `load-prompts`
**Operation ID:** `internalLoadPromptsCreate` (Note: "Create" is a misnomer, it fetches/loads from Langchain Hub)
**Description:** Fetches a prompt template from Langchain Hub by its name and parses it into a structured format. This does not save anything to the local database or file system but rather dynamically retrieves and processes a prompt from the Hub.

**Key Files:**
*   **Router:** `packages/server/src/routes/load-prompts/index.ts`
*   **Controller:** `packages/server/src/controllers/load-prompts/index.ts` (Handler: `createPrompt`)
*   **Service:** `packages/server/src/services/load-prompts/index.ts` (Method: `createPrompt`)
*   **Utility:** `packages/server/src/utils/hub.ts` (Function: `parsePrompt`)
*   **Library:** `langchainhub` (for `Client().pull()`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/load-prompt/`
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema (`application/json`):**
    *   `promptName` (string, required): The name/path of the prompt on Langchain Hub (e.g., "hwchase17/react").
        *   *Example:* `"hwchase17/multi-prompt-router"`
*   **Example Request Body:**
    ```json
    {
      "promptName": "hwchase17/react-chat"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully fetched and parsed the prompt from Langchain Hub.
    *   **Content (`application/json`):**
        *   Schema:
            ```json
            {
              "status": "string", // e.g., "OK"
              "prompt": "string", // The requested promptName
              "templates": [ // Array of parsed template objects
                {
                  "type": "string", // e.g., "systemMessagePrompt", "humanMessagePrompt", "aiMessagePrompt", "template"
                  "typeDisplay": "string", // e.g., "System Message", "Human Message", "AI Message", "Prompt"
                  "template": "string" // The actual prompt template string
                }
              ]
            }
            ```
*   **`412 Precondition Failed`:**
    *   **Description:** `promptName` not provided in the request body.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Error fetching from Langchain Hub, parsing the prompt, or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates presence of `req.body.promptName`.
2. Calls service `createPrompt(promptName)`.
3. Service initializes Langchain Hub client and calls `hub.pull(promptName)` to fetch the raw prompt string.
4. Service calls local utility `parsePrompt()` with the raw prompt string.
5. `parsePrompt` parses the string as JSON. If it contains `kwargs.messages` (ChatPromptTemplate format), it iterates through messages, extracting template type and content. If it contains `kwargs.template` (PromptTemplate format), it extracts that.
6. Service returns an object containing the status, original prompt name, and the array of parsed templates.
7. Controller returns this object as JSON.
