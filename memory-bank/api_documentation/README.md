# Remodl Core - Internal API Documentation

Welcome to the internal API documentation for Remodl Core. This documentation set provides developers with a comprehensive understanding of available internal endpoints, their usage, data structures, and security mechanisms.

## Main OpenAPI Specification

The complete OpenAPI 3.1.0 specification for the Remodl Core internal API will be consolidated into a single file.
*   [Main OpenAPI Specification (remodl-core-internal-api-v1.yaml)](./remodl-core-internal-api-v1.yaml)
    *(Note: This file will be fully assembled in a subsequent phase (API_DOC_P3).)*

## Documentation Structure Overview

This `api_documentation` directory is organized as follows:

*   **`./endpoint_analysis/`**: Contains detailed Markdown analysis for each API endpoint, grouped by module. These files cover endpoint functionality, request/response structures, parameters, authentication details, and logic flow.
*   **`./openapi_fragments/`**: Contains OpenAPI 3.1.0 path item fragment YAML files for each individual endpoint, grouped by module. These fragments are used to build the main OpenAPI specification.
*   **`./schemas/`**: Contains OpenAPI 3.1.0 schema definition YAML files.
    *   **`./schemas/modules/`**: For schemas primarily used by a single API module (e.g., `ChatflowsSchemas.yaml`). Note that not every module will have a uniquely named schema file here if it primarily uses shared schemas or its schemas are incorporated into a larger related module (e.g., OpenAI Assistant schemas).
    *   **`./schemas/shared/`**: For common schemas reused across multiple modules (e.g., `CommonSchemas.yaml`, `ErrorResponse.yaml`).
*   **`./security_analysis.md`**: Provides a detailed analysis of the API security patterns observed in Remodl Core.
*   **`./README.md`** (this file): The main navigation entry point for all documentation artifacts.

## API Security Overview

The Remodl Core API employs several security mechanisms:

1.  **Global API Key Authentication:** Most internal API routes (those under `/api/v1/`) are protected by a global middleware that requires a valid Remodl Core API key. This key must be provided as a Bearer token in the `Authorization` header (e.g., `Authorization: Bearer <YOUR_API_KEY>`). This applies to most administrative and backend-focused endpoints, including those for managing API keys and chatflows.
2.  **Whitelisted Public Endpoints:** Certain endpoints are whitelisted and do not require Bearer token authentication for general access. These include:
    *   Public prediction endpoints (e.g., `/api/v1/prediction/:id`), which primarily rely on domain origin checks (`allowedOrigins` in the chatflow's `chatbotConfig`) for security.
    *   Publicly accessible informational endpoints (e.g., `/api/v1/public-chatflows/:id`, `/api/v1/ping`).
    *   Specific utility endpoints like `/api/v1/verify/apikey/:apikey`.
3.  **Internal Requests:** Requests with an `x-request-from: internal` header can also bypass the global API key check, intended for trusted internal service communication.
4.  **Chatflow-Specific API Key Validation:** While not part of the global middleware, a mechanism (`validateChatflowAPIKey`) exists to tie specific chatflows to particular API keys via the `chatflow.apikeyid` field. This can be used by specific controller methods to enforce that an operation on a chatflow is performed using its designated key, in addition to any global key requirements.

For a complete understanding of the security mechanisms, including API key generation, storage, and validation processes, please refer to the [Full Security Details](./security_analysis.md).

## API Modules & Endpoint Documentation

The following is a list of all documented API route modules within Remodl Core, based on the `remodl-core-route-module-inventory.md`. Each module groups a set of related API endpoints.

### Agentflow V2 Generator (`agentflowv2-generator`)
- [Detailed Endpoint Analysis](./endpoint_analysis/agentflowv2-generator/)
- [OpenAPI Path Fragments](./openapi_fragments/agentflowv2-generator/)
- [Module-Specific Schemas](./schemas/modules/AgentflowV2GeneratorSchemas.yaml)

### API Key Management (`apikey`)
- [Detailed Endpoint Analysis](./endpoint_analysis/apikey/)
- [OpenAPI Path Fragments](./openapi_fragments/apikey/)
- [Module-Specific Schemas](./schemas/modules/ApiKeySchemas.yaml)

### Assistants (`assistants`)
- [Detailed Endpoint Analysis](./endpoint_analysis/assistants/)
- [OpenAPI Path Fragments](./openapi_fragments/assistants/)
- [Module-Specific Schemas](./schemas/modules/AssistantsSchemas.yaml) *(see also `schemas/modules/openai_assistant_api/`)*

### Attachments (`attachments`)
- [Detailed Endpoint Analysis](./endpoint_analysis/attachments/)
- [OpenAPI Path Fragments](./openapi_fragments/attachments/)
- [Module-Specific Schemas](./schemas/modules/AttachmentsSchemas.yaml)

### Chat Messages (`chat-messages`)
- [Detailed Endpoint Analysis](./endpoint_analysis/chat-messages/)
- [OpenAPI Path Fragments](./openapi_fragments/chat-messages/)
- [Module-Specific Schemas](./schemas/modules/ChatMessagesSchemas.yaml)

### Chatflows (`chatflows`)
- [Detailed Endpoint Analysis](./endpoint_analysis/chatflows/)
- [OpenAPI Path Fragments](./openapi_fragments/chatflows/)
- [Module-Specific Schemas](./schemas/modules/ChatflowsSchemas.yaml)

### Chatflows Streaming (`chatflows-streaming`)
- [Detailed Endpoint Analysis](./endpoint_analysis/chatflows-streaming/)
- [OpenAPI Path Fragments](./openapi_fragments/chatflows-streaming/)
- *(Uses general Chatflow/Prediction schemas)*

### Chatflows Uploads (`chatflows-uploads`)
- [Detailed Endpoint Analysis](./endpoint_analysis/chatflows-uploads/)
- [OpenAPI Path Fragments](./openapi_fragments/chatflows-uploads/)
- *(No dedicated module schema file expected)*

### Components Credentials (`components-credentials`)
- [Detailed Endpoint Analysis](./endpoint_analysis/components-credentials/)
- [OpenAPI Path Fragments](./openapi_fragments/components-credentials/)
- [Module-Specific Schemas](./schemas/modules/ComponentsCredentialsSchemas.yaml)

### Components Credentials Icon (`components-credentials-icon`)
- [Detailed Endpoint Analysis](./endpoint_analysis/components-credentials-icon/)
- [OpenAPI Path Fragments](./openapi_fragments/components-credentials-icon/)
- *(Serves image data)*

### Credentials (`credentials`)
- [Detailed Endpoint Analysis](./endpoint_analysis/credentials/)
- [OpenAPI Path Fragments](./openapi_fragments/credentials/)
- [Module-Specific Schemas](./schemas/modules/CredentialsSchemas.yaml)

### Document Store (`documentstore`)
- [Detailed Endpoint Analysis](./endpoint_analysis/documentstore/)
- [OpenAPI Path Fragments](./openapi_fragments/documentstore/)
- [Module-Specific Schemas](./schemas/modules/DocumentStoreSchemas.yaml)

### Executions (`executions`)
- [Detailed Endpoint Analysis](./endpoint_analysis/executions/)
- [OpenAPI Path Fragments](./openapi_fragments/executions/)
- [Module-Specific Schemas](./schemas/modules/ExecutionsSchemas.yaml)

### Export/Import (`export-import`)
- [Detailed Endpoint Analysis](./endpoint_analysis/export-import/)
- [OpenAPI Path Fragments](./openapi_fragments/export-import/)
- *(Deals with full chatflow JSON structures)*

### Feedback (`feedback`)
- [Detailed Endpoint Analysis](./endpoint_analysis/feedback/)
- [OpenAPI Path Fragments](./openapi_fragments/feedback/)
- [Module-Specific Schemas](./schemas/modules/FeedbackSchemas.yaml)

### Fetch Links (`fetch-links`)
- [Detailed Endpoint Analysis](./endpoint_analysis/fetch-links/)
- [OpenAPI Path Fragments](./openapi_fragments/fetch-links/)
- *(No dedicated module schema file expected)*

### Flow Config (`flow-config`)
- [Detailed Endpoint Analysis](./endpoint_analysis/flow-config/)
- [OpenAPI Path Fragments](./openapi_fragments/flow-config/)
- *(Returns part of Chatflow flowData)*

### Get Upload File (`get-upload-file`)
- [Detailed Endpoint Analysis](./endpoint_analysis/get-upload-file/)
- [OpenAPI Path Fragments](./openapi_fragments/get-upload-file/)
- *(Serves files)*

### Get Upload Path (`get-upload-path`)
- [Detailed Endpoint Analysis](./endpoint_analysis/get-upload-path/)
- [OpenAPI Path Fragments](./openapi_fragments/get-upload-path/)
- [Module-Specific Schemas](./schemas/modules/GetUploadPathSchemas.yaml)

### Internal Chat Messages (`internal-chat-messages`)
- [Detailed Endpoint Analysis](./endpoint_analysis/internal-chat-messages/)
- [OpenAPI Path Fragments](./openapi_fragments/internal-chat-messages/)
- *(Uses general ChatMessages schemas)*

### Internal Predictions (`internal-predictions`)
- [Detailed Endpoint Analysis](./endpoint_analysis/internal-predictions/)
- [OpenAPI Path Fragments](./openapi_fragments/internal-predictions/)
- *(Uses general Prediction/Chatflow schemas)*

### Leads (`leads`)
- [Detailed Endpoint Analysis](./endpoint_analysis/leads/)
- [OpenAPI Path Fragments](./openapi_fragments/leads/)
- [Module-Specific Schemas](./schemas/modules/LeadsSchemas.yaml)

### Load Prompts (`load-prompts`)
- [Detailed Endpoint Analysis](./endpoint_analysis/load-prompts/)
- [OpenAPI Path Fragments](./openapi_fragments/load-prompts/)
- [Module-Specific Schemas](./schemas/modules/LoadPromptsSchemas.yaml)

### Marketplaces (`marketplaces`)
- [Detailed Endpoint Analysis](./endpoint_analysis/marketplaces/)
- [OpenAPI Path Fragments](./openapi_fragments/marketplaces/)
- [Module-Specific Schemas](./schemas/modules/MarketplacesSchemas.yaml)

### Node Configs (`node-configs`)
- [Detailed Endpoint Analysis](./endpoint_analysis/node-configs/)
- [OpenAPI Path Fragments](./openapi_fragments/node-configs/)
- *(Returns specific node tool config)*

### Node Custom Functions (`node-custom-functions`)
- [Detailed Endpoint Analysis](./endpoint_analysis/node-custom-functions/)
- [OpenAPI Path Fragments](./openapi_fragments/node-custom-functions/)
- [Module-Specific Schemas](./schemas/modules/NodeCustomFunctionsSchemas.yaml)

### Node Icons (`node-icons`)
- [Detailed Endpoint Analysis](./endpoint_analysis/node-icons/)
- [OpenAPI Path Fragments](./openapi_fragments/node-icons/)
- *(Serves image data)*

### Node Load Methods (`node-load-methods`)
- [Detailed Endpoint Analysis](./endpoint_analysis/node-load-methods/)
- [OpenAPI Path Fragments](./openapi_fragments/node-load-methods/)
- [Module-Specific Schemas](./schemas/modules/NodeLoadMethodsSchemas.yaml)

### Nodes (`nodes`)
- [Detailed Endpoint Analysis](./endpoint_analysis/nodes/)
- [OpenAPI Path Fragments](./openapi_fragments/nodes/)
- [Module-Specific Schemas](./schemas/modules/NodesSchemas.yaml) *(see also `schemas/shared/flowiseComponentSchemas.yaml`)*

### NVIDIA NIM (`nvidia-nim`)
- [Detailed Endpoint Analysis](./endpoint_analysis/nvidia-nim/)
- [OpenAPI Path Fragments](./openapi_fragments/nvidia-nim/)
- [Module-Specific Schemas](./schemas/modules/NvidiaNimSchemas.yaml)

### OpenAI Assistants (`openai-assistants`)
- [Detailed Endpoint Analysis](./endpoint_analysis/openai-assistants/)
- [OpenAPI Path Fragments](./openapi_fragments/openai-assistants/)
- *(Uses `schemas/modules/openai_assistant_api/` extensively)*

### OpenAI Assistants Files (`openai-assistants-files`)
- [Detailed Endpoint Analysis](./endpoint_analysis/openai-assistants-files/)
- [OpenAPI Path Fragments](./openapi_fragments/openai-assistants-files/)
- *(Uses `schemas/modules/openai_assistant_api/` extensively)*

### OpenAI Assistants Vector Store (`openai-assistants-vector-store`)
- [Detailed Endpoint Analysis](./endpoint_analysis/openai-assistants-vector-store/)
- [OpenAPI Path Fragments](./openapi_fragments/openai-assistants-vector-store/)
- *(Uses `schemas/modules/openai_assistant_api/` extensively)*

### OpenAI Realtime (`openai-realtime`)
- [Detailed Endpoint Analysis](./endpoint_analysis/openai-realtime/)
- [OpenAPI Path Fragments](./openapi_fragments/openai-realtime/)
- *(Uses `schemas/modules/openai_assistant_api/` for streamed events)*

### Ping (`ping`)
- [Detailed Endpoint Analysis](./endpoint_analysis/ping/)
- [OpenAPI Path Fragments](./openapi_fragments/ping/)
- *(No dedicated module schema file expected)*

### Predictions (`predictions`)
- [Detailed Endpoint Analysis](./endpoint_analysis/predictions/)
- [OpenAPI Path Fragments](./openapi_fragments/predictions/)
- [Module-Specific Schemas](./schemas/modules/PredictionsSchemas.yaml)

### Prompts Lists (`prompts-lists`)
- [Detailed Endpoint Analysis](./endpoint_analysis/prompts-lists/)
- [OpenAPI Path Fragments](./openapi_fragments/prompts-lists/)
- [Module-Specific Schemas](./schemas/modules/PromptsListsSchemas.yaml)

### Public Chatbots (`public-chatbots`)
- [Detailed Endpoint Analysis](./endpoint_analysis/public-chatbots/)
- [OpenAPI Path Fragments](./openapi_fragments/public-chatbots/)
- *(Returns ChatbotConfig from Chatflow; uses `ChatflowsSchemas.yaml`)*

### Public Chatflows (`public-chatflows`)
- [Detailed Endpoint Analysis](./endpoint_analysis/public-chatflows/)
- [OpenAPI Path Fragments](./openapi_fragments/public-chatflows/)
- *(Returns Chatflow; uses `ChatflowsSchemas.yaml`)*

### Public Executions (`public-executions`)
- [Detailed Endpoint Analysis](./endpoint_analysis/public-executions/)
- [OpenAPI Path Fragments](./openapi_fragments/public-executions/)
- *(Uses `ExecutionsSchemas.yaml`)*

### Stats (`stats`)
- [Detailed Endpoint Analysis](./endpoint_analysis/stats/)
- [OpenAPI Path Fragments](./openapi_fragments/stats/)
- [Module-Specific Schemas](./schemas/modules/StatsSchemas.yaml)

### Tools (`tools`)
- [Detailed Endpoint Analysis](./endpoint_analysis/tools/)
- [OpenAPI Path Fragments](./openapi_fragments/tools/)
- [Module-Specific Schemas](./schemas/modules/ToolsSchemas.yaml)

### Upsert History (`upsert-history`)
- [Detailed Endpoint Analysis](./endpoint_analysis/upsert-history/)
- [OpenAPI Path Fragments](./openapi_fragments/upsert-history/)
- [Module-Specific Schemas](./schemas/modules/UpsertHistorySchemas.yaml)

### Validation (`validation`)
- [Detailed Endpoint Analysis](./endpoint_analysis/validation/)
- [OpenAPI Path Fragments](./openapi_fragments/validation/)
- [Module-Specific Schemas](./schemas/modules/ValidationSchemas.yaml)

### Variables (`variables`)
- [Detailed Endpoint Analysis](./endpoint_analysis/variables/)
- [OpenAPI Path Fragments](./openapi_fragments/variables/)
- [Module-Specific Schemas](./schemas/modules/VariablesSchemas.yaml)

### Vectors (`vectors`)
- [Detailed Endpoint Analysis](./endpoint_analysis/vectors/)
- [OpenAPI Path Fragments](./openapi_fragments/vectors/)
- *(Related to Document Store and embeddings)*

### Verify (`verify`)
- [Detailed Endpoint Analysis](./endpoint_analysis/verify/)
- [OpenAPI Path Fragments](./openapi_fragments/verify/)
- *(Uses `ApiKeySchemas.yaml`)*

### Versions (`versions`)
- [Detailed Endpoint Analysis](./endpoint_analysis/versions/)
- [OpenAPI Path Fragments](./openapi_fragments/versions/)
- [Module-Specific Schemas](./schemas/modules/VersionsSchemas.yaml)

## How to Use Schemas

The API request and response schemas are defined using OpenAPI 3.1.0. You will find these in two main locations under the [`./schemas/`](./schemas/) directory:
*   **`./schemas/modules/`**: Contains YAML files with schema definitions specific to a particular API module (e.g., `ChatflowsSchemas.yaml` defines DTOs and structures for the Chatflows API).
*   **`./schemas/shared/`**: Contains YAML files with common, reusable schema definitions that might be used by multiple API modules (e.g., `ErrorResponse.yaml`, `Pagination.yaml`).

Individual endpoint fragments in the [`./openapi_fragments/`](./openapi_fragments/) directory reference these schemas using the `$ref` keyword, like:
`$ref: '#/components/schemas/Chatflow'`
(This would typically resolve to a schema defined in one of the YAML files under `./schemas/` when the full OpenAPI specification is assembled). 