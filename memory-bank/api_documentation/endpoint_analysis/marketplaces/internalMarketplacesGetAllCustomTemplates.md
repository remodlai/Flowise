# Endpoint Analysis: GET /api/v1/marketplaces/custom

**Module:** `marketplaces`
**Operation ID:** `internalMarketplacesGetAllCustomTemplates`
**Description:** Retrieves all user-saved custom templates from the database. These include templates created from existing chatflows or custom tool definitions.

**Key Files:**
*   Router: `routes/marketplaces/index.ts`
*   Controller: `controllers/marketplaces/index.ts` (Handler: `getAllCustomTemplates`)
*   Service: `services/marketplaces/index.ts` (Method: `getAllCustomTemplates`)
*   Entity: `database/entities/CustomTemplate.ts`
*   Interface: `Interface.ts` (Interface: `ICustomTemplate`)

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/marketplaces/custom`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved all custom templates from the database.
    *   Content (`application/json`):
        *   Schema: Array of custom template items where each item has:
            ```json
            [
                {
                  "id": "string", // UUID
                  "name": "string",
                  "flowData": "string", // For non-Tool types, stringified JSON of flow structure, nullable
                  "type": "string", // "Chatflow", "Tool", "Agentflow", or "AgentflowV2"
                  "description": "string", // Nullable
                  "badge": "string", // Nullable
                  "framework": "string", // Nullable, stored as string in entity
                  "usecases": ["string"], // Array, parsed from JSON string stored in entity
                  "categories": ["string"], // Derived for non-Tool types from flowData
                  "createdDate": "2023-06-15T15:45:00Z",
                  "updatedDate": "2023-06-15T15:45:00Z",
                  // For Tool type, additional properties are extracted from flowData:
                  "iconSrc": "string", // If type is Tool
                  "schema": "string", // If type is Tool
                  "func": "string" // If type is Tool
                }
                // ... more custom templates
            ]
            ```
*   **`500 Internal Server Error`:** Database error or issue retrieving templates.

**Core Logic Summary:**
1. Controller calls service `getAllCustomTemplates()`.
2. Service queries the database using TypeORM repository `getRepository(CustomTemplate).find()` to fetch all custom templates.
3. Service processes each template's data:
   - Parses `usecases` JSON string to an array
   - For `Tool` type templates, parses `flowData` to extract `iconSrc`, `schema`, and `func`
   - For non-`Tool` types, derives `categories` by calling `getCategories()` on parsed `flowData`
   - Sets `badge` and `framework` defaults if not present
4. Returns the array of processed template items.

**Implementation Notes:**
* This endpoint is used by the UI to retrieve user-created templates for display in the marketplace UI.
* The templates are stored in the database (unlike built-in templates which are loaded from JSON files).
* The response structure closely matches the GET /marketplaces/templates endpoint, but includes timestamps.
* The entity stores some fields like `usecases` as JSON strings, but they're parsed into proper arrays for the API response.