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
*   **Headers:** 
    *   `Content-Type: application/json`
    *   `Authorization: Bearer YOUR_API_KEY` or `X-Api-Key: YOUR_API_KEY`
*   **Request Body Schema (`application/json`):**
    *   `promptName` (string, required): The name/path of the prompt on Langchain Hub (e.g., "hwchase17/react").
        *   Format is typically `owner/prompt-id` where `owner` is the Langchain Hub username.
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
        *   **Example Response:**
            ```json
            {
              "status": "OK",
              "prompt": "hwchase17/react-chat",
              "templates": [
                {
                  "type": "systemMessagePrompt",
                  "typeDisplay": "System Message",
                  "template": "You are a helpful AI assistant that follows the ReAct framework."
                },
                {
                  "type": "humanMessagePrompt",
                  "typeDisplay": "Human Message",
                  "template": "{input}"
                }
              ]
            }
            ```
*   **`412 Precondition Failed`:**
    *   **Description:** `promptName` not provided in the request body.
    *   **Content (`application/json`):** Error response with message about missing promptName.
    *   **Example:**
        ```json
        {
          "error": "Error: loadPromptsController.createPrompt - promptName not provided!"
        }
        ```
*   **`500 Internal Server Error`:**
    *   **Description:** Error fetching from Langchain Hub, parsing the prompt, or other server-side issue.
    *   **Content (`application/json`):** Error response with details about the specific error.
    *   **Example (Prompt Not Found):**
        ```json
        {
          "error": "Error: loadPromptsService.createPrompt - Not Found"
        }
        ```

**Core Logic Summary:**
1. Controller validates presence of `req.body.promptName`.
2. If promptName is missing, returns a 412 error with appropriate message.
3. Calls service `createPrompt(promptName)`.
4. Service initializes Langchain Hub client with `new Client()`.
5. Service calls `hub.pull(promptName)` to fetch the raw prompt string from Langchain Hub.
6. Service calls local utility `parsePrompt()` with the raw prompt string.
7. `parsePrompt` parses the string as JSON and analyzes its structure:
   * If it contains `kwargs.messages` (ChatPromptTemplate format), it iterates through each message, extracting:
     * Message type (based on ID: SystemMessagePromptTemplate, HumanMessagePromptTemplate, or AIMessagePromptTemplate)
     * Display type (Human Message, System Message, or AI Message)
     * Template content (from kwargs.prompt.kwargs.template)
   * If it contains `kwargs.template` (PromptTemplate format), it extracts:
     * Type: "template"
     * Display type: "Prompt"
     * Template content (from kwargs.template)
8. Service returns an object containing:
   * status: "OK"
   * prompt: The original promptName
   * templates: The array of parsed templates
9. Controller returns this object as JSON.

**Implementation Notes:**
* This endpoint is primarily used by prompt-related nodes in the UI to load templates from Langchain Hub.
* The endpoint dynamically fetches prompts at runtime rather than storing them locally, ensuring access to the latest versions.
* The parsing logic handles both regular PromptTemplate and ChatPromptTemplate formats from Langchain Hub.
* The endpoint response includes type information to help UI components render the prompt appropriately.
* Error handling includes:
  * Client-side validation of promptName
  * Network error handling for Langchain Hub connections
  * JSON parsing error handling for malformed prompt templates
* No caching mechanism is implemented - each request triggers a new pull from Langchain Hub.
* Authentication is required to prevent unauthorized access to potentially sensitive prompt templates.

**External Dependencies:**
* Requires network access to Langchain Hub (langchain.com)
* Relies on the `langchainhub` library to handle authentication and fetching from Langchain Hub
* Expected prompt JSON format follows Langchain's serialization conventions
