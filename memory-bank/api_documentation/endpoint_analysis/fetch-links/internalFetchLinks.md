# Endpoint Analysis: GET /api/v1/fetch-links/

**Module:** `fetch-links`
**Operation ID:** `internalFetchLinks`
**Description:** Fetches links from a given URL using either web crawling or XML scraping methods. Returns an array of links up to the specified limit.

**Key Files:**
* Router: `routes/fetch-links/index.ts`
* Controller: `controllers/fetch-links/index.ts` (Handler: `getAllLinks`)
* Service: `services/fetch-links/index.ts` (Method: `getAllLinks`)
* Components: `webCrawl`, `xmlScrape` from `flowise-components`

**Authentication:** Requires API Key.

**Query Parameters:**
*   `url` (string, required): The URL to fetch links from (must be URL-encoded).
*   `relativeLinksMethod` (string, required, enum: `webCrawl`, `xmlScrape`): Method to use for finding relative links.
*   `limit` (string, required): Maximum number of links to retrieve (will be parsed as integer).

**Responses:**
*   **`200 OK`:** Returns a response object with status and links array.
    ```json
    {
      "status": "OK",
      "links": ["https://example.com/page1", "https://example.com/page2", ...]
    }
    ```
*   **`412 Precondition Failed`:** Missing required parameters (url, relativeLinksMethod, or limit).
*   **`500 Internal Server Error`:** Errors during link retrieval or other server issues.
