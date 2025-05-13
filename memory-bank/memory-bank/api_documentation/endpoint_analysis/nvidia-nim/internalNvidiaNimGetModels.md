# Endpoint Analysis: GET /api/v1/nvidia-nim/models

**Module:** `nvidia-nim`
**Operation ID:** `internalNvidiaNimGetModels`
**Description:** Retrieves a list of available NVIDIA NIM models. If an `NVIDIA_API_KEY` environment variable is configured, it attempts to fetch the models from the NVIDIA API. Otherwise, it returns a predefined list of common NIM models.

**Key Files:**
*   Router: `routes/nvidia-nim/index.ts`
*   Controller: `controllers/nvidia-nim/index.ts` (Handler: `getNvidiaNimModels`)
*   Service: `services/nvidia-nim/index.ts` (Method: `getNvidiaNimModels`)

**Authentication:** Requires Remodl Core API Key. The service itself may use an `NVIDIA_API_KEY` for external calls.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/nvidia-nim/models`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the list of NVIDIA NIM models.
    *   Content (`application/json`):
        *   Schema: Array of objects, each representing a model.
            *   Example item from hardcoded list: `{ "id": "playground_llama2_13b", "name": "Llama2-13B" }`
            *   If fetched from NVIDIA API, the structure might be more complex, typically including fields like `id`, `name`, `modelType`, `state`, etc. (The service standardizes this to an array of `{ id: string, label: string, name: string }` for UI).
*   **`500 Internal Server Error`:** Error fetching from NVIDIA API or other server-side issue.

**Core Logic Summary:**
1. Controller calls service `getNvidiaNimModels()`.
2. Service checks for `process.env.NVIDIA_API_KEY`.
3. If API key exists:
    a. Makes a GET request to `https://api.nvcf.nvidia.com/v2/nvcf/pexec/status`.
    b. Parses the response (array of functions), filters for those with `status: "ACTIVE"` and `functionType: "model"`.
    c. Maps them to an array of `{ id: function.id, label: function.name, name: function.name }`.
4. If API key does NOT exist:
    a. Returns a hardcoded array of common NIM models (e.g., `playground_llama2_13b`, `playground_mistral_7b`).
5. Controller returns the list as JSON.
