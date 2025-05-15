# Endpoint Analysis: DELETE /api/v1/marketplaces/custom/:id

**Module:** `marketplaces`
**Operation ID:** `internalMarketplacesDeleteCustomTemplate`
**Description:** Deletes a specific custom template from the database by its ID.

**Key Files:**
*   Router: `routes/marketplaces/index.ts`
*   Controller: `controllers/marketplaces/index.ts` (Handler: `deleteCustomTemplate`)
*   Service: `services/marketplaces/index.ts` (Method: `deleteCustomTemplate`)
*   Entity: `database/entities/CustomTemplate.ts`

**Authentication:** Requires API Key.

**Request:**
*   Method: `DELETE`
*   Path: `/api/v1/marketplaces/custom/:id`
*   Path Parameters:
    *   `id` (string, format: uuid, required): ID of the custom template to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Custom template successfully deleted.
    *   Content (`application/json`): 
        *   DeleteResult from TypeORM, containing information about the deletion operation. For example:
            ```json
            {
              "raw": [],
              "affected": 1
            }
            ```
        *   `affected` indicates the number of rows deleted (typically 1 or 0).
*   **`412 Precondition Failed`:**
    *   Description: Missing ID parameter.
    *   Content (`application/json`): 
        *   Error response with message indicating that ID was not provided.
*   **`500 Internal Server Error`:**
    *   Description: Database error or issue deleting the template.
    *   Content (`application/json`): 
        *   Error response with details about the issue.

**Core Logic Summary:**
1. Controller validates that the request contains `params.id`.
2. If ID is missing, throws a `InternalFlowiseError` with `StatusCodes.PRECONDITION_FAILED`.
3. Controller calls service `deleteCustomTemplate(req.params.id)`.
4. Service gets the AppDataSource from the running Express app.
5. Service uses TypeORM repository to delete the template: `AppDataSource.getRepository(CustomTemplate).delete({ id: templateId })`.
6. Service returns the DeleteResult object from TypeORM.
7. Controller responds with the result of the service call.

**Implementation Notes:**
* This endpoint allows users to remove their own custom templates from the marketplace.
* The route is registered with two patterns in the router: `/` and `/custom/:id`. The controller logic implies it's intended for the `/custom/:id` route.
* The response is a direct pass-through of TypeORM's DeleteResult object, which provides information about the operation's success.
* No validation is performed to confirm the template exists before attempting deletion - non-existent IDs simply return a DeleteResult with `affected: 0`.