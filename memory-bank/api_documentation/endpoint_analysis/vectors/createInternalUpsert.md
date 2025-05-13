# Endpoint Analysis: POST /api/v1/vectors/internal-upsert/{id} (and /internal-upsert/)

**Module:** `vectors`
**Operation ID:** `createInternalUpsert`
**Description:** Internally used endpoint to upsert documents/vectors to a target vector store within a specified chatflow. Functionally identical to the public `/vectors/upsert` endpoint but bypasses API key validation. Supports `multipart/form-data`.

**Key Files:**
*   Router: `packages/server/src/routes/vectors/index.ts`
*   Controller: `packages/server/src/controllers/vectors/index.ts` (Handler: `createInternalUpsert`)
*   Service: `packages/server/src/services/vectors/index.ts` (Method: `upsertVectorMiddleware` with `isInternal=true`)
*   Core Logic: `packages/server/src/utils/upsertVector.ts`
*   Schema File: `api_documentation/schemas/modules/VectorsSchemas.yaml`

**Authentication:** None (intended for internal use, API key validation is skipped by the service).

**Request:**
*   Method: `POST`
*   Path: `/api/v1/vectors/internal-upsert/{id}` or `/api/v1/vectors/internal-upsert/`
    *   `{id}` is `chatflowid`.
*   **Path Parameters:**
    *   `id` (string, format: uuid, optional): Chatflow ID.
*   **Content-Type:** `application/json` or `multipart/form-data`.
*   **Request Body Schema:** `$ref: '../../schemas/modules/VectorsSchemas.yaml#/components/schemas/VectorUpsertRequest'`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Upsert operation successful or queued.
    *   Content (`application/json`): Schema `$ref: '../../schemas/modules/VectorsSchemas.yaml#/components/schemas/VectorUpsertResponse'`.
*   **`400 Bad Request` / `404 Not Found` / `500 Internal Server Error`**: Same as public upsert endpoint, less likely 401.

**Core Logic Summary:**
Identical to `POST /vectors/upsert/{id}` but the `isInternal` flag is set to `true` when calling the underlying service, which bypasses API key validation in `utilUpsertVector`. 