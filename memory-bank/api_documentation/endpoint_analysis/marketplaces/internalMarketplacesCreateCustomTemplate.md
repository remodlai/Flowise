# Endpoint Analysis: POST /api/v1/marketplaces/custom

**Module:** `marketplaces`
**Operation ID:** `internalMarketplacesCreateCustomTemplate`
**Description:** Saves a custom template to the database. This can be done by either creating a template from an existing chatflow or by directly providing tool definitions.

**Key Files:**
*   Router: `routes/marketplaces/index.ts`
*   Controller: `controllers/marketplaces/index.ts` (Handler: `saveCustomTemplate`)
*   Service: `services/marketplaces/index.ts` (Method: `saveCustomTemplate`)
*   Entity: `database/entities/CustomTemplate.ts`
*   Interface: `Interface.ts` (Interface: `ICustomTemplate`)
*   Related Service: `services/chatflows/index.ts` (Method: `getChatflowById`) - Used when copying from existing chatflow

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/marketplaces/custom`
*   Headers: 
    *   `Content-Type: application/json`
*   Request Body Schema (`application/json`):
    *   `name` (string, required): Name for the custom template.
    *   `description` (string, optional): Description of the template.
    *   `badge` (string, optional): Badge indicator.
    *   `type` (string, optional): Type of template. If saving a tool, this should be set to "Tool".
    *   `usecases` (array of strings, optional): Array of use case identifiers.
    *   `chatflowId` (string, optional): ID of an existing chatflow to save as template. Required if not providing tool details.
    *   `tool` (object, optional): Details of a tool to save as template. Required if not providing chatflowId.
        *   `iconSrc` (string, optional): Icon source for the tool.
        *   `schema` (string): Stringified JSON schema for the tool.
        *   `func` (string): Stringified code/JSON for the tool's function.
*   Example Request Body (Chatflow-based):
    ```json
    {
      "name": "My Custom Chatflow Template",
      "description": "A template based on my chatflow",
      "badge": "Community",
      "usecases": ["Customer Support", "FAQ"],
      "chatflowId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
*   Example Request Body (Tool-based):
    ```json
    {
      "name": "My Custom Tool Template",
      "description": "A custom tool template",
      "badge": "Custom",
      "type": "Tool",
      "usecases": ["Data Processing"],
      "tool": {
        "iconSrc": "data:image/png;base64,...",
        "schema": "{\"input\":{\"type\":\"object\",\"properties\":{\"input\":{\"type\":\"string\"}}}}",
        "func": "function myTool(input) { return input.toUpperCase(); }"
      }
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Custom template successfully saved.
    *   Content (`application/json`): 
        *   The saved template entity with an assigned ID, timestamps, and the processed data.
        *   For chatflow-based templates, the `flowData` is a stringified JSON of the flow structure.
        *   For tool-based templates, the properties are similar to the request structure with appropriate type and framework settings.
*   **`412 Precondition Failed`:**
    *   Description: Missing required fields (body, name, or neither chatflowId nor tool provided).
    *   Content (`application/json`): Error response with details about the missing fields.
*   **`500 Internal Server Error`:**
    *   Description: Database error or issue saving the template.
    *   Content (`application/json`): Error response with details about the issue.

**Core Logic Summary:**
1. Controller validates that the request body exists and that either `chatflowId` or `tool` is provided, along with required `name`.
2. Controller calls service `saveCustomTemplate(body)`.
3. Service creates a new `CustomTemplate` entity and assigns values from the request body.
4. Service handles two different template types:
   - For chatflow-based templates (`body.chatflowId` provided):
     * Retrieves the existing chatflow using `chatflowsService.getChatflowById(body.chatflowId)`
     * Parses the flow data and generates export-ready data with `_generateExportFlowData()`
     * Sets framework based on node tags in the flow data
     * Stringifies the export data for storage
   - For tool-based templates (`body.tool` provided):
     * Creates a structured flowData object with iconSrc, schema, and func
     * Sets framework to empty string and type to "Tool"
     * Stringifies the tool data for storage
5. Service stringifies `usecases` array if provided.
6. Service saves the entity to the database and returns the saved template.

**Implementation Notes:**
* This endpoint allows two distinct ways to create templates: from existing chatflows or as custom tools.
* For chatflow-based templates, it removes sensitive information like passwords, files, and folders from the inputs.
* The framework is automatically detected for chatflow-based templates by looking for tags like "LlamaIndex".
* The service includes detailed error handling for both validation and database errors.
* For tool-based templates, the flowData is stringified JSON of the tool definition, but the service also extracts and sets top-level properties for easier client-side access.