# Endpoint Analysis: GET /api/v1/marketplaces/templates

**Module:** `marketplaces`
**Operation ID:** `internalMarketplacesGetAllTemplates`
**Description:** Retrieves all available marketplace template items, categorized by type (Chatflow, Tool, Agentflow, AgentflowV2). These are loaded from JSON files within the application's `marketplaces` directory and returned in a consistent format.

**Key Files:**
*   Router: `routes/marketplaces/index.ts`
*   Controller: `controllers/marketplaces/index.ts` (Handler: `getAllTemplates`)
*   Service: `services/marketplaces/index.ts` (Method: `getAllTemplates`)
*   Data Source: JSON files in the following directories:
    * `packages/server/marketplaces/chatflows/` - For Chatflow templates
    * `packages/server/marketplaces/tools/` - For Tool templates
    * `packages/server/marketplaces/agentflows/` - For Agentflow templates
    * `packages/server/marketplaces/agentflowsv2/` - For AgentflowV2 templates

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/marketplaces/templates`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved all marketplace templates.
    *   Content (`application/json`):
        *   Schema: Array of template items where each item has:
            ```json
            [
                {
                  "id": "string", // System-generated UUID
                  "templateName": "string",
                  "flowData": "string", // Stringified JSON of ReactFlow graph (for flow types)
                  "type": "string", // "Chatflow", "Tool", "Agentflow", or "AgentflowV2"
                  "description": "string",
                  "badge": "string",
                  "framework": ["string"], // Array of framework names
                  "usecases": ["string"], // Array of use case names
                  "categories": ["string"], // Array of category names (derived from flow nodes)
                  // For Tool type, additional properties may be present:
                  "iconSrc": "string", // if Tool type
                  "schema": "string", // if Tool type (stringified JSON schema)
                  "func": "string" // if Tool type (stringified function code)
                }
              // ... more template items  
            ]
            ```
*   **`500 Internal Server Error`:** Error reading or parsing marketplace files.

**Core Logic Summary:**
1. Controller calls service `getAllTemplates()`.
2. Service reads all `.json` files from each of the marketplace subdirectories.
3. For each file, service:
   - Reads the file content using `fs.readFileSync()`
   - Parses the JSON content
   - Generates a UUID for the template
   - Derives `templateName` from the filename (without .json extension)
   - For flow-based templates (Chatflow, Agentflow, AgentflowV2):
     * Keeps `flowData` as a stringified JSON string
     * Extracts `badge`, `framework`, and `usecases` from the JSON data
     * Calculates `categories` using the `getCategories()` utility function
   - For tool templates:
     * Extracts `iconSrc`, `schema`, and `func` directly as top-level properties
4. Service sorts all templates by templateName.
5. Service moves the "Flowise Docs QnA" template to the beginning if present.
6. Returns the sorted array of template items.

**Implementation Notes:**
* This endpoint is used by the UI to populate the marketplace templates library.
* Templates are read directly from the filesystem rather than being stored in a database.
* The service generates UUIDs for templates each time the endpoint is called - these IDs are not persistent.
* The implementation handles different template types with type-specific processing.
* Templates with the special name "Flowise Docs QnA" are prioritized in the results order.
* Unlike custom templates (from the `/marketplaces/custom` endpoint), these built-in templates are read-only. 