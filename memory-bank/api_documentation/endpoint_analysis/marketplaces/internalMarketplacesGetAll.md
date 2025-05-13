# Endpoint Analysis: GET /api/v1/marketplaces/

**Module:** `marketplaces`
**Operation ID:** `internalMarketplacesGetAll`
**Description:** Retrieves all available marketplace items, categorized into chatflows, tools, agentflows, and agentflowsv2. These are loaded from JSON files within the application's `marketplaces` directory.

**Key Files:**
*   Router: `routes/marketplaces/index.ts`
*   Controller: `controllers/marketplaces/index.ts` (Handler: `getAllMarketplaces`)
*   Service: `services/marketplaces/index.ts` (Method: `getAllMarketplaces`)
*   Data Source: JSON files in `packages/server/marketplaces/` subdirectories.

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/marketplaces/`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved all marketplace items.
    *   Content (`application/json`):
        *   Schema:
            ```json
            {
              "chatflows": [ // Array of chatflow template objects
                {
                  "templateName": "string",
                  "flowData": "string", // Stringified JSON of ReactFlow graph
                  "description?": "string",
                  "category?": "string",
                  // ... other fields from chatflow marketplace JSON files
                }
              ],
              "tools": [ // Array of tool template objects
                {
                  "templateName": "string",
                  "nodes": [ /* array of node data objects */ ],
                  "description?": "string",
                  "category?": "string",
                  // ... other fields from tool marketplace JSON files
                }
              ],
              "agentflows": [ // Array of agentflow (V1) template objects
                // Similar structure to chatflows
              ],
              "agentflowsv2": [ // Array of agentflow V2 template objects
                // Similar structure, potentially more complex (nodes, edges, viewport)
              ]
            }
            ```
*   **`500 Internal Server Error`:** Error reading or parsing marketplace files.

**Core Logic Summary:**
1. Controller calls service `getAllMarketplaces()`.
2. Service reads all `.json` files from subdirectories: `marketplaces/chatflows`, `marketplaces/tools`, `marketplaces/agentflows`, `marketplaces/agentflowsv2`.
3. For each file, it parses the JSON content and adds a `templateName` (derived from filename) to each object.
4. Aggregates these into four arrays under the keys `chatflows`, `tools`, `agentflows`, and `agentflowsv2` in the response object.
