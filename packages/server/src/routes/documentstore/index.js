"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const documentstore_1 = __importDefault(require("../../controllers/documentstore"));
const utils_1 = require("../../utils");
const router = express_1.default.Router();
router.post(['/upsert/', '/upsert/:id'], (0, utils_1.getMulterStorage)().array('files'), documentstore_1.default.upsertDocStoreMiddleware);
router.post(['/refresh/', '/refresh/:id'], documentstore_1.default.refreshDocStoreMiddleware);
/** Document Store Routes */
// Create document store
router.post('/store', documentstore_1.default.createDocumentStore);
// List all stores
router.get('/store', documentstore_1.default.getAllDocumentStores);
// Get specific store
router.get('/store/:id', documentstore_1.default.getDocumentStoreById);
// Update documentStore
router.put('/store/:id', documentstore_1.default.updateDocumentStore);
// Delete documentStore
router.delete('/store/:id', documentstore_1.default.deleteDocumentStore);
// Get document store configs
router.get('/store-configs/:id/:loaderId', documentstore_1.default.getDocStoreConfigs);
/** Component Nodes = Document Store - Loaders */
// Get all loaders
router.get('/components/loaders', documentstore_1.default.getDocumentLoaders);
// delete loader from document store
router.delete('/loader/:id/:loaderId', documentstore_1.default.deleteLoaderFromDocumentStore);
// chunking preview
router.post('/loader/preview', documentstore_1.default.previewFileChunks);
// saving process
router.post('/loader/save', documentstore_1.default.saveProcessingLoader);
// chunking process
router.post('/loader/process/:loaderId', documentstore_1.default.processLoader);
/** Document Store - Loaders - Chunks */
// delete specific file chunk from the store
router.delete('/chunks/:storeId/:loaderId/:chunkId', documentstore_1.default.deleteDocumentStoreFileChunk);
// edit specific file chunk from the store
router.put('/chunks/:storeId/:loaderId/:chunkId', documentstore_1.default.editDocumentStoreFileChunk);
// Get all file chunks from the store
router.get('/chunks/:storeId/:fileId/:pageNo', documentstore_1.default.getDocumentStoreFileChunks);
// add chunks to the selected vector store
router.post('/vectorstore/insert', documentstore_1.default.insertIntoVectorStore);
// save the selected vector store
router.post('/vectorstore/save', documentstore_1.default.saveVectorStoreConfig);
// delete data from the selected vector store
router.delete('/vectorstore/:storeId', documentstore_1.default.deleteVectorStoreFromStore);
// query the vector store
router.post('/vectorstore/query', documentstore_1.default.queryVectorStore);
// Get all embedding providers
router.get('/components/embeddings', documentstore_1.default.getEmbeddingProviders);
// Get all vector store providers
router.get('/components/vectorstore', documentstore_1.default.getVectorStoreProviders);
// Get all Record Manager providers
router.get('/components/recordmanager', documentstore_1.default.getRecordManagerProviders);
// update the selected vector store from the playground
router.post('/vectorstore/update', documentstore_1.default.updateVectorStoreConfigOnly);
// generate docstore tool description
router.post('/generate-tool-desc/:id', documentstore_1.default.generateDocStoreToolDesc);
exports.default = router;
//# sourceMappingURL=index.js.map