# Remodl Core Endpoint Mapping - Batch 1 (Task T2.1 / ID: 6dfcd9e9-...)

This document contains the mapped endpoints for the first batch of 5 modules as per Task T2.1.

## Module: agentflowv2-generator
- **Endpoint:** `POST` `/api/v1/agentflowv2-generator/generate`
  - **Controller Handler:** `agentflowv2GeneratorController.generateAgentflowv2`
  - **Service Method Hint:** `agentflowv2Service.generateAgentflowv2`

## Module: apikey
- **Endpoint:** `POST` `/api/v1/apikey/`
  - **Controller Handler:** `apikeyController.createApiKey`
  - **Service Method Hint:** `apikeyService.createApiKey`
- **Endpoint:** `POST` `/api/v1/apikey/import`
  - **Controller Handler:** `apikeyController.importKeys`
  - **Service Method Hint:** `apikeyService.importKeys`
- **Endpoint:** `GET` `/api/v1/apikey/`
  - **Controller Handler:** `apikeyController.getAllApiKeys`
  - **Service Method Hint:** `apikeyService.getAllApiKeys`
- **Endpoint:** `PUT` `/api/v1/apikey/` (also handles `/:id`)
  - **Controller Handler:** `apikeyController.updateApiKey`
  - **Service Method Hint:** `apikeyService.updateApiKey`
- **Endpoint:** `DELETE` `/api/v1/apikey/` (also handles `/:id`)
  - **Controller Handler:** `apikeyController.deleteApiKey`
  - **Service Method Hint:** `apikeyService.deleteApiKey`

## Module: assistants
- **Endpoint:** `POST` `/api/v1/assistants/`
  - **Controller Handler:** `assistantsController.createAssistant`
  - **Service Method Hint:** (Likely `assistantsService.createAssistant`)
- **Endpoint:** `GET` `/api/v1/assistants/`
  - **Controller Handler:** `assistantsController.getAllAssistants`
  - **Service Method Hint:** (Likely `assistantsService.getAllAssistants`)
- **Endpoint:** `GET` `/api/v1/assistants/` (also handles `/:id`)
  - **Controller Handler:** `assistantsController.getAssistantById`
  - **Service Method Hint:** (Likely `assistantsService.getAssistantById`)
- **Endpoint:** `PUT` `/api/v1/assistants/` (also handles `/:id`)
  - **Controller Handler:** `assistantsController.updateAssistant`
  - **Service Method Hint:** (Likely `assistantsService.updateAssistant`)
- **Endpoint:** `DELETE` `/api/v1/assistants/` (also handles `/:id`)
  - **Controller Handler:** `assistantsController.deleteAssistant`
  - **Service Method Hint:** (Likely `assistantsService.deleteAssistant`)
- **Endpoint:** `GET` `/api/v1/assistants/components/chatmodels`
  - **Controller Handler:** `assistantsController.getChatModels`
  - **Service Method Hint:** (Likely internal to controller or a utility)
- **Endpoint:** `GET` `/api/v1/assistants/components/docstores`
  - **Controller Handler:** `assistantsController.getDocumentStores`
  - **Service Method Hint:** (Likely internal to controller or a utility)
- **Endpoint:** `GET` `/api/v1/assistants/components/tools`
  - **Controller Handler:** `assistantsController.getTools`
  - **Service Method Hint:** (Likely internal to controller or a utility)
- **Endpoint:** `POST` `/api/v1/assistants/generate/instruction`
  - **Controller Handler:** `assistantsController.generateAssistantInstruction`
  - **Service Method Hint:** (Likely `assistantsService.generateAssistantInstruction`)

## Module: attachments
- **Endpoint:** `POST` `/api/v1/attachments/:chatflowId/:chatId`
  - **Controller Handler:** `attachmentsController.createAttachment`
  - **Service Method Hint:** (Likely `attachmentsService.createAttachment`)

## Module: chat-messages
- **Endpoint:** `POST` `/api/v1/chatmessage/` (also handles `/:id`)
  - **Controller Handler:** `chatMessageController.createChatMessage`
  - **Service Method Hint:** (Likely `chatMessageService.createChatMessage`)
- **Endpoint:** `GET` `/api/v1/chatmessage/` (also handles `/:id`)
  - **Controller Handler:** `chatMessageController.getAllChatMessages`
  - **Service Method Hint:** (Likely `chatMessageService.getAllChatMessages`)
- **Endpoint:** `PUT` `/api/v1/chatmessage/abort/` (also handles `/:chatflowid/:chatid`)
  - **Controller Handler:** `chatMessageController.abortChatMessage`
  - **Service Method Hint:** (Likely `chatMessageService.abortChatMessage`)
- **Endpoint:** `DELETE` `/api/v1/chatmessage/` (also handles `/:id`)
  - **Controller Handler:** `chatMessageController.removeAllChatMessages`
  - **Service Method Hint:** (Likely `chatMessageService.removeAllChatMessages`)
