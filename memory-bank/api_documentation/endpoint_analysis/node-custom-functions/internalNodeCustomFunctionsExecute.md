# Endpoint Analysis: POST /api/v1/node-custom-function/

**Module:** `node-custom-functions`

**Operation ID:** `internalNodeCustomFunctionsExecute`

**Description:** Executes a custom JavaScript function provided in the request body. Input variables for the function can be passed in the request body and are referenced in the script using `$[variableName]` syntax.

**Key Files:**
*   Router: `routes/node-custom-functions/index.ts`
*   Controller: `controllers/nodes/index.ts` (Handler: `executeCustomFunction`)
*   Service: `services/nodes/index.ts` (Method: `executeCustomFunction`)
*   Core Node: `customFunction` node component (dynamically loaded and initialized)

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/node-custom-function/`
*   Headers: `Content-Type: application/json`
*   **Request Body Schema (`application/json`):**
    *   `javascriptFunction` (string, required): The JavaScript code to execute. Input variables can be accessed within the code using `$[variableName]` syntax.
    *   Additional properties (any, optional): Any other key-value pairs provided in the request body will be available as input variables to the custom function if referenced as `$[propertyName]`.
        *   *Example:* If body is `{"javascriptFunction": "return $[a] + $[b];", "a": 5, "b": 10}`, the function receives `a=5` and `b=10`.
*   **Example Request Body:**
    ```json
    {
      "javascriptFunction": "const sum = $[val1] + $[val2]; return { \"result\": sum };",
      "val1": 10,
      "val2": 25
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Custom function executed successfully.
    *   Content (`application/json`): The return value of the executed JavaScript function. The schema is dynamic (`any`) based on what the custom function returns.
    *   *Example (for above request):* `{"result": 35}`
*   **`412 Precondition Failed`:**
    *   Description: Request body not provided.
    *   Content (`application/json`): Error response with message.
*   **`500 Internal Server Error`:**
    *   Description: Error during custom function execution (e.g., syntax error in script, runtime error, or 'customFunction' node not found).
    *   Content (`application/json`): Error response with details.

**Core Logic Summary:**
1. Controller validates `req.body`.
2. Service extracts variable placeholders from `javascriptFunction` using regex pattern `/\$([a-zA-Z0-9_]+)/g` to identify variables.
3. Service filters out any variables with "vars" in the name.
4. Service prepares `nodeData.inputs` by combining the identified variables with the rest of `req.body`.
5. Service dynamically loads and initializes the 'customFunction' node.
6. Calls the `init` method of the 'customFunction' node instance with the prepared `nodeData`. This `init` method executes the provided JavaScript.
7. Returns the result from the custom function's execution (with escape character handling if string result).

**Implementation Notes:**
* The function variables are extracted from the JavaScript code using a regular expression.
* Any variable names containing "vars" are filtered out.
* The implementation uses the `handleEscapeCharacters` utility to properly handle escape characters in string results.
* The 'customFunction' node is dynamically loaded at runtime from the system's component nodes pool.
* If the 'customFunction' node is not found, the request will fail with a 500 error.
