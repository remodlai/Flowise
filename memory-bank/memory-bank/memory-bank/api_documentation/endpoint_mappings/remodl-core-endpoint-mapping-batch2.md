# Remodl Core Endpoint Mapping - Batch 2 (Task T2.2)

This document contains the enriched mapped endpoints for the second batch of 5 modules. File paths for router, controller, and service are included.

## Module: chatflows
- **Endpoint:** `POST` `/api/v1/chatflows/`
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.saveChatflow`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.saveChatflow`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`
- **Endpoint:** `POST` `/api/v1/chatflows/importchatflows`
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.importChatflows`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.importChatflows`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`
- **Endpoint:** `GET` `/api/v1/chatflows/`
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.getAllChatflows` (also `getChatflowById` for this path)
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.getAllChatflows` / `chatflowsService.getChatflowById`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`
- **Endpoint:** `GET` `/api/v1/chatflows/:id`
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.getChatflowById`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.getChatflowById`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`
- **Endpoint:** `GET` `/api/v1/chatflows/apikey/:apikey` (also handles `/apikey/`)
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.getChatflowByApiKey`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.getChatflowByApiKey` (uses `apiKeyService.getApiKey`)
  - **Service File:** `packages/server/src/services/chatflows/index.ts` (and `services/apikey/index.ts`)
- **Endpoint:** `PUT` `/api/v1/chatflows/:id` (also handles `/`)
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.updateChatflow`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.updateChatflow`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`
- **Endpoint:** `DELETE` `/api/v1/chatflows/:id` (also handles `/`)
  - **Router File:** `packages/server/src/routes/chatflows/index.ts`
  - **Controller Handler:** `chatflowsController.deleteChatflow`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.deleteChatflow`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`

## Module: chatflows-streaming
- **Endpoint:** `GET` `/api/v1/chatflows-streaming/:id` (also handles `/`)
  - **Router File:** `packages/server/src/routes/chatflows-streaming/index.ts`
  - **Controller Handler:** `chatflowsController.checkIfChatflowIsValidForStreaming`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.checkIfChatflowIsValidForStreaming`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`

## Module: chatflows-uploads
- **Endpoint:** `GET` `/api/v1/chatflows-uploads/:id` (also handles `/`)
  - **Router File:** `packages/server/src/routes/chatflows-uploads/index.ts`
  - **Controller Handler:** `chatflowsController.checkIfChatflowIsValidForUploads`
  - **Controller File:** `packages/server/src/controllers/chatflows/index.ts`
  - **Service Method Hint:** `chatflowsService.checkIfChatflowIsValidForUploads`
  - **Service File:** `packages/server/src/services/chatflows/index.ts`

## Module: components-credentials
- **Endpoint:** `GET` `/api/v1/components-credentials/`
  - **Router File:** `packages/server/src/routes/components-credentials/index.ts`
  - **Controller Handler:** `componentsCredentialsController.getAllComponentsCredentials`
  - **Controller File:** `packages/server/src/controllers/components-credentials/index.ts`
  - **Service Method Hint:** `componentsCredentialsService.getAllComponentsCredentials`
  - **Service File:** `packages/server/src/services/components-credentials/index.ts`
- **Endpoint:** `GET` `/api/v1/components-credentials/:name` (also handles `/`)
  - **Router File:** `packages/server/src/routes/components-credentials/index.ts`
  - **Controller Handler:** `componentsCredentialsController.getComponentByName`
  - **Controller File:** `packages/server/src/controllers/components-credentials/index.ts`
  - **Service Method Hint:** `componentsCredentialsService.getComponentByName`
  - **Service File:** `packages/server/src/services/components-credentials/index.ts`

## Module: components-credentials-icon
- **Endpoint:** `GET` `/api/v1/components-credentials-icon/:name` (also handles `/`)
  - **Router File:** `packages/server/src/routes/components-credentials-icon/index.ts`
  - **Controller Handler:** `componentsCredentialsController.getSingleComponentsCredentialIcon`
  - **Controller File:** `packages/server/src/controllers/components-credentials/index.ts`
  - **Service Method Hint:** `componentsCredentialsService.getSingleComponentsCredentialIcon`
  - **Service File:** `packages/server/src/services/components-credentials/index.ts`
