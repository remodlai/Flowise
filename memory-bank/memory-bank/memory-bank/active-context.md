# Current Context

## Corrective Documentation Tasks (Highest Priority)
- **Objective:** Fully and correctly document all previously simulated Remodl Core server API endpoints. No shortcuts. This includes defining schemas for all DTOs/Interfaces used in request/response bodies and referencing them in OpenAPI fragments.
- **Method:** For each operation, perform a deep-dive analysis (router, controller, service, entities, interfaces) and generate complete Markdown analysis, OpenAPI fragment files, and necessary schema definitions. Store in Memory Bank.
- **Tracking:** Use `progress.md` to log start/completion of each item.

- **P2.Batch3.1: 'credentials' Module (Task ID `c4e1b042-...`) - Corrective Action - All operations complete**
    - [x] `POST /api/v1/credentials/` (createCredential) (Corrected & Schema-Aware)
    - [x] `GET /api/v1/credentials/` (getAllCredentials) (Corrected & Schema-Aware)
    - [x] `GET /api/v1/credentials/:id` (getCredentialById) (Corrected & Schema-Aware)
    - [x] `PUT /api/v1/credentials/:id` (updateCredential) (Corrected & Schema-Aware)
    - [x] `DELETE /api/v1/credentials/:id` (deleteCredentials) (Corrected & Schema-Aware)
- **P2.Batch3.2: 'documentstore' Module (Task ID `82130a35-...`) - Corrective Action - In Progress**
    - [x] `POST /api/v1/document-stores/store` (createDocumentStore) (Corrected & Schema-Aware)
    - [x] `GET /api/v1/document-stores/store` (getAllDocumentStores) (Corrected & Schema-Aware)
    - [x] `GET /api/v1/document-stores/store/:id` (getDocumentStoreById) (Corrected & Schema-Aware)
    - [x] `PUT /api/v1/document-stores/store/:id` (updateDocumentStore) (Corrected & Schema-Aware)
    - [x] `DELETE /api/v1/document-stores/store/:id` (deleteDocumentStore) (Corrected & Schema-Aware)
    - [x] `POST /api/v1/document-stores/upsert/:id?` (upsertDocStoreMiddleware - file upload) (Corrected & Schema-Aware)
    - [x] `POST /api/v1/document-stores/refresh/:id?` (refreshDocStoreMiddleware) (Corrected & Schema-Aware)
    - [ ] `GET /api/v1/document-stores/store-configs/:id/:loaderId` (getDocStoreConfigs) **<-- PAUSED HERE**
    - [ ] `GET /api/v1/document-stores/components/loaders` (getDocumentLoaders)
    - [ ] `DELETE /api/v1/document-stores/loader/:id/:loaderId` (deleteLoaderFromDocumentStore)
    - [ ] `POST /api/v1/document-stores/loader/preview` (previewFileChunks)
    - [ ] `POST /api/v1/document-stores/loader/save` (saveProcessingLoader)
    - [ ] `POST /api/v1/document-stores/loader/process/:loaderId` (processLoader)
    - [ ] `DELETE /api/v1/document-stores/chunks/:storeId/:loaderId/:chunkId` (deleteDocumentStoreFileChunk)
    - [ ] `PUT /api/v1/document-stores/chunks/:storeId/:loaderId/:chunkId` (editDocumentStoreFileChunk)
    - [ ] `GET /api/v1/document-stores/chunks/:storeId/:fileId/:pageNo` (getDocumentStoreFileChunks)
    - [ ] `POST /api/v1/document-stores/vectorstore/insert` (insertIntoVectorStore)
    - [ ] `POST /api/v1/document-stores/vectorstore/save` (saveVectorStoreConfig)
    - [ ] `DELETE /api/v1/document-stores/vectorstore/:storeId` (deleteVectorStoreFromStore)
    - [ ] `POST /api/v1/document-stores/vectorstore/query` (queryVectorStore)
    - [ ] `POST /api/v1/document-stores/vectorstore/update` (updateVectorStoreConfigOnly)
    - [ ] `GET /api/v1/document-stores/components/embeddings` (getEmbeddingProviders)
    - [ ] `GET /api/v1/document-stores/components/vectorstore` (getVectorStoreProviders)
    - [ ] `GET /api/v1/document-stores/components/recordmanager` (getRecordManagerProviders)
    - [ ] `POST /api/v1/document-stores/generate-tool-desc/:id` (generateDocStoreToolDesc)
- **P2.Batch3.3: 'executions' Module (Task ID `1c449138-...`) - Corrective Action**
    - [x] `GET /api/v1/executions/` (getAllExecutions) (Corrected & Schema-Aware)
    - [ ] `GET /api/v1/executions/:id` (getExecutionById)
    - [ ] `PUT /api/v1/executions/:id` (updateExecution)
    - [ ] `DELETE /api/v1/executions/:id` (deleteExecutions - path param version)
    - [ ] `DELETE /api/v1/executions/` (deleteExecutions - root path version, if different logic)
- **[ ] P2.Batch5.1: 'internal-predictions' Module (Task ID `58ea379b-...`) - Needs to be properly executed/re-done. (Currently marked "PAUSED" in Shrimp Task Manager)**
    - [ ] `POST /api/v1/internal-predictions/:id`

## Ongoing Tasks

- P2.Batch5.1: 'internal-predictions' Module (Task ID `58ea379b-...`) - Corrected & Schema-Aware - All operations COMPLETE
    - [x] `POST /api/v1/internal-predictions/:id` (Corrected & Schema-Aware)
## Known Issues
- None specific to the new `remodel-v2-base` branch yet.
- Previously identified "gotchas" in the underlying **Remodl Core** engine (e.g., base64 image uploads) will be addressed by architectural choices for the Remodl AI Platform (e.g., pre-processing via Supabase, Zuplo transformations) rather than deep core modifications to **Remodl Core**.

## Next Steps (Immediate)
1.  **Discuss and Finalize Strategy for Defining and Managing Reusable OpenAPI Schemas:**
    *   Determine a dedicated location in Memory Bank (e.g., `api_documentation/schemas/`) for storing YAML schema definitions (e.g., `sharedSchemas.yaml`, `documentStoreSchemas.yaml`, etc.).
    *   Establish a workflow for creating/updating these schema files alongside endpoint documentation.
2.  Update `system-patterns.md` to reflect this schema management strategy.
3.  Resume and complete all corrective documentation tasks using the refined schema strategy.
4.  Resume Shrimp Task Manager workflow for new API documentation batches.

## Current Session Notes

- [11:15:15 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/marketplaces/internalMarketplacesGetAll.yaml
- [11:14:45 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/marketplaces/internalMarketplacesGetAll.md
- [11:12:30 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/load-prompts/internalLoadPromptsCreate.yaml
- [11:12:04 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/load-prompts/internalLoadPromptsCreate.md
- [11:06:43 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/leads/internalLeadsGetAllByChatflowId.yaml
- [11:06:15 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/leads/internalLeadsGetAllByChatflowId.md
- [11:04:14 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/leads/internalLeadsCreate.yaml
- [11:03:59 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/leads/internalLeadsCreate.md
- [11:03:02 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/leads/internalLeadsCreate.md
- [10:54:57 PM] [Unknown User] Corrective Documentation - Completed Module: P2.Batch5.1: 'internal-predictions' Module - `POST /:id` operation. Full analysis, schema definition, and artifact generation complete.
- [10:54:46 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/internal-predictions/internalPredictionsCreateInternal.yaml
- [10:54:28 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/internal-predictions/internalPredictionsCreateInternal.md
- [10:53:46 PM] [Unknown User] Corrective Documentation - Completed Module: P2.Batch3.3: 'executions' Module - ALL operations. Full analysis, schema definition, and artifact generation complete.
- [10:53:25 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/executions/internalExecutionsDeleteAllFiltered.yaml
- [10:52:57 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/executions/internalExecutionsDeleteAllFiltered.md
- [10:52:36 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/executions/internalExecutionsDeleteById.yaml
- [10:52:20 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/executions/internalExecutionsDeleteById.md
- [10:52:00 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/executions/internalExecutionsUpdate.yaml
- [10:51:48 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/executions/internalExecutionsUpdate.md
- [10:51:32 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/executions/internalExecutionsGetById.yaml
- [10:51:20 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/executions/internalExecutionsGetById.md
- [10:50:35 PM] [Unknown User] Corrective Documentation - Completed Module: P2.Batch3.2: 'documentstore' Module - ALL ~25 operations. Full analysis, schema definitions, and artifact generation complete for the entire module.
- [5:37:07 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - GET /api/v1/document-stores/components/loaders (getDocumentLoaders). Full analysis, schema definition, and artifact generation complete.
- [5:36:57 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/documentstore/internalDocumentStoreGetComponentLoaders.yaml
- [5:36:46 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/documentstore/internalDocumentStoreGetComponentLoaders.md
- [5:36:32 PM] [Unknown User] File Update: Updated api_documentation/schemas/modules/documentStoreSchemas.yaml
- [5:34:58 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - GET /api/v1/document-stores/store-configs/:id/:loaderId (getDocStoreConfigs). Full analysis, schema definition, and artifact generation complete.
- [5:34:48 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/documentstore/internalDocumentStoreGetConfigs.yaml
- [5:34:26 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/documentstore/internalDocumentStoreGetConfigs.md
- [5:33:53 PM] [Unknown User] File Update: Updated api_documentation/schemas/modules/documentStoreSchemas.yaml
- [5:33:01 PM] [Unknown User] File Update: Updated system-patterns.md
- [5:28:23 PM] [Unknown User] File Update: Updated api_documentation/schemas/shared/ErrorResponse.yaml
- [5:23:13 PM] [Unknown User] File Update: Updated system-patterns.md
- [5:20:37 PM] [Unknown User] Process Adjustment - Paused Corrective Work: Paused detailed endpoint documentation to discuss and refine strategy for defining and managing reusable OpenAPI schemas for DTOs/Interfaces. Current corrective work on 'documentstore' module is halted before 'GET /store-configs/:id/:loaderId'. Next step: Schema strategy discussion.
- [5:20:21 PM] [Unknown User] File Update: Updated active-context.md
- [5:17:07 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - POST /api/v1/document-stores/refresh/:id? (refreshDocStoreMiddleware). Full analysis and artifact generation complete.
- [5:16:58 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/documentstore/internalDocumentStoreRefresh.yaml
- [5:16:47 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/documentstore/internalDocumentStoreRefresh.md
- [5:15:54 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - POST /api/v1/document-stores/upsert/:id? (upsertDocStoreMiddleware - file upload). Full analysis and artifact generation (detailed multipart form data) complete.
- [5:15:47 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/documentstore/internalDocumentStoreUpsert.yaml
- [5:15:27 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/documentstore/internalDocumentStoreUpsert.md
- [5:04:20 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - DELETE /api/v1/document-stores/store/:id (deleteDocumentStore). Full analysis and artifact generation complete.
- [5:03:27 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - PUT /api/v1/document-stores/store/:id (updateDocumentStore). Full analysis and artifact generation complete.
- [5:01:11 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - GET /api/v1/document-stores/store/:id (getDocumentStoreById). Full analysis and artifact generation (including DTO definition details) complete.
- [4:59:49 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.2: 'documentstore' Module - GET /api/v1/document-stores/store (getAllDocumentStores). Full analysis and artifact generation (including DTO definition details) complete.
- [4:57:19 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.1: 'credentials' Module - DELETE /api/v1/credentials/:id (deleteCredentials). Full analysis and artifact generation complete. Files: api_documentation/endpoint_analysis/credentials/internalCredentialsDelete.md, api_documentation/openapi_fragments/credentials/internalCredentialsDelete.yaml
- [4:57:06 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.1: 'credentials' Module - PUT /api/v1/credentials/:id (updateCredential). Full analysis and artifact generation complete. Files: api_documentation/endpoint_analysis/credentials/internalCredentialsUpdate.md, api_documentation/openapi_fragments/credentials/internalCredentialsUpdate.yaml
- [4:56:53 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.1: 'credentials' Module - GET /api/v1/credentials/:id (getCredentialById). Full analysis and artifact generation complete. Files: api_documentation/endpoint_analysis/credentials/internalCredentialsGetById.md, api_documentation/openapi_fragments/credentials/internalCredentialsGetById.yaml
- [4:56:36 PM] [Unknown User] Corrective Documentation - Completed Operation: P2.Batch3.1: 'credentials' Module - GET /api/v1/credentials/ (getAllCredentials). Full analysis and artifact generation complete. Files: api_documentation/endpoint_analysis/credentials/internalCredentialsGetAll.md, api_documentation/openapi_fragments/credentials/internalCredentialsGetAll.yaml
- Terminology update: "Flowise" (as the engine) is now referred to as "Remodl Core".
- Prioritized full documentation of **Remodl Core** server routes before making UI architectural changes.
- Decision made to "start fresh" on `remodel-v2-base` (based on upstream Flowise v2.2.8) for **Remodl Core**.
- The Remodl AI Platform features multi-application, multi-tenant architecture (Supabase for business logic, Zuplo for API gateway).
- Custom UI for Remodl AI Platform will likely be in a duplicated, dedicated UI package.
- The `Flowise` directory contains the **Remodl Core** codebase (forked initially from FlowiseAI). `Flowise-Upstream` is a reference clone.
- Memory Bank path: `/Users/brianbagdasarian/projects/Flowise/memory-bank/memory-bank/memory-bank`.
- Documented the monorepo build & serve pattern (for **Remodl Core**) in `system-patterns.md`.
- Confirmed `packages/api-documentation` relates to the public API of the underlying engine.
