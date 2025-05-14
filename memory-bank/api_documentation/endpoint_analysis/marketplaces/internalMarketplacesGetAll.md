# Endpoint Analysis: GET /api/v1/marketplaces/templates

**Module:** `marketplaces`
**Operation ID:** `internalMarketplacesGetAllTemplates`
**Description:** Retrieves all available marketplace template items, categorized by type (Chatflow, Tool, Agentflow, AgentflowV2). These are loaded from JSON files within the application's `marketplaces` directory.

**Key Files:**
*   Router: `routes/marketplaces/index.ts`
*   Controller: `controllers/marketplaces/index.ts` (Handler: `getAllTemplates`)
*   Service: `services/marketplaces/index.ts` (Method: `getAllTemplates`)
*   Data Source: JSON files in `packages/server/marketplaces/` subdirectories.

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
2. Service reads all `.json` files from subdirectories: `marketplaces/chatflows`, `marketplaces/tools`, `marketplaces/agentflows`, `marketplaces/agentflowsv2`.
3. For each file, it parses the JSON content and adds a `templateName` (derived from filename) and other metadata to each object.
4. Returns an array of template items organized by their type.
