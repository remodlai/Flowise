# Current Context

## Ongoing Tasks
- **Remodl Core Server API Understanding & Documentation (Highest Priority):**
    - Systematically review all route definitions in `packages/server/src/routes/` of the **Remodl Core** codebase.
    - Document the structure, purpose, expected request/response schemas, and any associated controller/service logic for each API endpoint.
    - This internal documentation is crucial before proceeding with Remodl AI Platform UI architecture decisions or implementation.
- **Strategic Refoundation (Secondary Focus, pending API documentation):**
    - Base branch `remodel-v2-base` (from `FlowiseAI/Flowise` main v2.2.8, forming the basis of **Remodl Core**) is created and ready.
    - Plan for potential duplication of `packages/ui` (the standard **Remodl Core** UI) into `packages/remodl-ui` (or similar) for custom Remodl AI Platform UI, to be executed *after* server API documentation is complete.
- **Platform Feature Development (Post-Refoundation & API Doc):**
    - Define/implement custom **Remodl Core** nodes in `packages/components` for Supabase integration.
    - Develop Remodl AI Platform UI in the designated UI package.
    - Configure Zuplo API Gateway.

## Known Issues
- None specific to the new `remodel-v2-base` branch yet.
- Previously identified "gotchas" in the underlying **Remodl Core** engine (e.g., base64 image uploads) will be addressed by architectural choices for the Remodl AI Platform (e.g., pre-processing via Supabase, Zuplo transformations) rather than deep core modifications to **Remodl Core**.

## Next Steps (Immediate)
1.  **Begin detailed review and documentation of `packages/server/src/routes/` (within Remodl Core) and their corresponding controllers/services.**
2.  Identify key **Remodl Core** API endpoints that will be consumed by the Remodl AI Platform UI (via Zuplo).
3.  Once **Remodl Core** server APIs are well-understood and documented, revisit the Remodl AI Platform UI strategy:
    *   Confirm the exact name for the new custom UI package directory.
    *   Plan modifications to monorepo configuration files.
    *   Plan the duplication/creation of the custom UI package.

## Current Session Notes

- [4:16:43 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/chat-messages/internalChatMessagesRemoveAll.yaml
- [4:16:30 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/chat-messages/internalChatMessagesRemoveAll.md
- [4:15:45 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/chat-messages/internalChatMessagesAdd.yaml
- [4:15:33 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/chat-messages/internalChatMessagesAdd.md
- [4:14:45 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/chat-messages/internalChatMessagesGetAll.yaml
- [4:14:31 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/chat-messages/internalChatMessagesGetAll.md
- [4:12:18 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/attachments/internalAttachmentsDelete.yaml
- [4:12:12 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/attachments/internalAttachmentsDelete.md
- [4:12:03 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/attachments/internalAttachmentsGetAll.yaml
- [4:11:58 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/attachments/internalAttachmentsGetAll.md
- [4:11:49 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/attachments/internalAttachmentsGetById.yaml
- [4:11:43 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/attachments/internalAttachmentsGetById.md
- [4:11:19 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/attachments/internalAttachmentsUpload.yaml
- [4:11:09 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/attachments/internalAttachmentsUpload.md
- [4:08:42 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/assistants/internalAssistantsCreate.yaml
- [4:08:29 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/assistants/internalAssistantsCreate.md
- [4:04:51 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/apikey/internalApikeyDelete.yaml
- [4:04:26 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/apikey/internalApikeyDelete.md
- [4:03:57 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/apikey/internalApikeyUpdate.yaml
- [4:03:42 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/apikey/internalApikeyUpdate.md
- [4:02:11 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/apikey/internalApikeyGetAllApiKeys.yaml
- [4:01:43 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/apikey/internalApikeyGetAllApiKeys.md
- [3:59:06 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/apikey/internalApikeyImportKeys.yaml
- [3:58:38 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/apikey/internalApikeyImportKeys.md
- [3:49:04 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/apikey/internalApikeyCreate.yaml
- [3:48:46 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/apikey/internalApikeyCreate.md
- [3:43:49 PM] [Unknown User] File Update: Updated api_documentation/openapi_fragments/agentflowv2-generator/internalAgentflowv2GeneratorGenerate.yaml
- [3:43:34 PM] [Unknown User] File Update: Updated api_documentation/endpoint_analysis/agentflowv2-generator/internalAgentflowv2GeneratorGenerate.md
- [3:33:45 PM] [Unknown User] File Update: Updated api_documentation/remodl-core-internal-api-v1.yaml
- [3:33:25 PM] [Unknown User] File Update: Updated api_documentation/remodl-core-route-module-inventory.md
- [3:17:24 PM] [Unknown User] File Update: Updated system-patterns.md
- [3:15:24 PM] [Unknown User] File Update: Updated api_documentation/endpoint_mappings/remodl-core-endpoint-mapping-batch2.md
- [3:05:01 PM] [Unknown User] File Update: Updated remodl-core-endpoint-mapping-batch2.md
- [3:03:15 PM] [Unknown User] File Update: Updated remodl-core-endpoint-mapping-batch2.md
- [2:52:56 PM] [Unknown User] File Update: Updated remodl-core-endpoint-mapping-batch2.md
- [2:46:50 PM] [Unknown User] File Update: Updated remodl-core-endpoint-mapping-batch2.md
- [2:42:01 PM] [Unknown User] File Update: Updated remodl-core-endpoint-mapping-batch1.md
- [2:36:20 PM] [Unknown User] File Update: Updated remodl-core-endpoint-mapping-batch1.md
- [1:24:59 PM] [Unknown User] File Update: Updated remodl-core-route-module-inventory.md
- [1:18:57 PM] [Unknown User] File Update: Updated active-context.md
- Terminology update: "Flowise" (as the engine) is now referred to as "Remodl Core".
- Prioritized full documentation of **Remodl Core** server routes before making UI architectural changes.
- Decision made to "start fresh" on `remodel-v2-base` (based on upstream Flowise v2.2.8) for **Remodl Core**.
- The Remodl AI Platform features multi-application, multi-tenant architecture (Supabase for business logic, Zuplo for API gateway).
- Custom UI for Remodl AI Platform will likely be in a duplicated, dedicated UI package.
- The `Flowise` directory contains the **Remodl Core** codebase (forked initially from FlowiseAI). `Flowise-Upstream` is a reference clone.
- Memory Bank path: `/Users/brianbagdasarian/projects/Flowise/memory-bank/memory-bank/memory-bank`.
- Documented the monorepo build & serve pattern (for **Remodl Core**) in `system-patterns.md`.
- Confirmed `packages/api-documentation` relates to the public API of the underlying engine.
