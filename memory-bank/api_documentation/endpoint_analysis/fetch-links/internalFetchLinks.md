# Endpoint Analysis: POST /api/v1/fetch-links/

**Module:** `fetch-links`
**Operation ID:** `internalFetchLinks`
**Description:** Fetches content from a given URL, optionally processing it to extract main content or specific data based on relative links or selectors. Uses `LinkContentRequest` from `flowise-components`.

**Key Files:**
* Router: `routes/fetch-links/index.ts`
* Controller: `controllers/fetch-links/index.ts` (Handler: `fetchLinks`)
* Service: `services/fetch-links/index.ts` (Method: `fetchLinks`)
* Component: `LinkContentRequest` from `flowise-components`

**Authentication:** Requires API Key.

**Request Body (`application/json`):**
*   `url` (string, required): The URL to fetch.
*   `relativeLinksMethod?` (string, optional): Method to find relative links (e.g., `web`, `github`).
*   `relativeLinksLimit?` (number, optional): Max number of relative links to process.
*   `selector?` (string, optional): CSS selector to extract specific content.
*   `configuration?` (any, optional): Puppeteer configurations.

**Responses:**
*   **`200 OK`:** Returns an array of `IDocument` objects from `flowise-components`.
*   **`500 Internal Server Error`**
