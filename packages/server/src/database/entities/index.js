"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = void 0;
const ChatFlow_1 = require("./ChatFlow");
const ChatMessage_1 = require("./ChatMessage");
const ChatMessageFeedback_1 = require("./ChatMessageFeedback");
const Credential_1 = require("./Credential");
const Tool_1 = require("./Tool");
const Assistant_1 = require("./Assistant");
const Variable_1 = require("./Variable");
const DocumentStore_1 = require("./DocumentStore");
const DocumentStoreFileChunk_1 = require("./DocumentStoreFileChunk");
const Lead_1 = require("./Lead");
const UpsertHistory_1 = require("./UpsertHistory");
const ApiKey_1 = require("./ApiKey");
const CustomTemplate_1 = require("./CustomTemplate");
exports.entities = {
    ChatFlow: ChatFlow_1.ChatFlow,
    ChatMessage: ChatMessage_1.ChatMessage,
    ChatMessageFeedback: ChatMessageFeedback_1.ChatMessageFeedback,
    Credential: Credential_1.Credential,
    Tool: Tool_1.Tool,
    Assistant: Assistant_1.Assistant,
    Variable: Variable_1.Variable,
    DocumentStore: DocumentStore_1.DocumentStore,
    DocumentStoreFileChunk: DocumentStoreFileChunk_1.DocumentStoreFileChunk,
    Lead: Lead_1.Lead,
    UpsertHistory: UpsertHistory_1.UpsertHistory,
    ApiKey: ApiKey_1.ApiKey,
    CustomTemplate: CustomTemplate_1.CustomTemplate
};
//# sourceMappingURL=index.js.map