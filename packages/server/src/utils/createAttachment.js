"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileAttachment = void 0;
const path = __importStar(require("path"));
const storageUtils_1 = require("@components/storageUtils");
const utils_1 = require("@components/utils");
const getRunningExpressApp_1 = require("./getRunningExpressApp");
const utils_2 = require("../errors/utils");
/**
 * Create attachment
 * @param {Request} req
 */
const createFileAttachment = async (req) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const chatflowid = req.params.chatflowId;
    if (!chatflowid) {
        throw new Error('Params chatflowId is required! Please provide chatflowId and chatId in the URL: /api/v1/attachments/:chatflowId/:chatId');
    }
    const chatId = req.params.chatId;
    if (!chatId) {
        throw new Error('Params chatId is required! Please provide chatflowId and chatId in the URL: /api/v1/attachments/:chatflowId/:chatId');
    }
    // Find FileLoader node
    const fileLoaderComponent = appServer.nodesPool.componentNodes['fileLoader'];
    const fileLoaderNodeInstanceFilePath = fileLoaderComponent.filePath;
    const fileLoaderNodeModule = await Promise.resolve(`${fileLoaderNodeInstanceFilePath}`).then(s => __importStar(require(s)));
    const fileLoaderNodeInstance = new fileLoaderNodeModule.nodeClass();
    const options = {
        retrieveAttachmentChatId: true,
        chatflowid,
        chatId
    };
    const files = req.files || [];
    const fileAttachments = [];
    if (files.length) {
        const isBase64 = req.body.base64;
        for (const file of files) {
            const fileBuffer = await (0, storageUtils_1.getFileFromUpload)(file.path ?? file.key);
            const fileNames = [];
            // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const storagePath = await (0, storageUtils_1.addArrayFilesToStorage)(file.mimetype, fileBuffer, file.originalname, fileNames, chatflowid, chatId);
            const fileInputFieldFromMimeType = (0, utils_1.mapMimeTypeToInputField)(file.mimetype);
            const fileExtension = path.extname(file.originalname);
            const fileInputFieldFromExt = (0, utils_1.mapExtToInputField)(fileExtension);
            let fileInputField = 'txtFile';
            if (fileInputFieldFromExt !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            else if (fileInputFieldFromMimeType !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            await (0, storageUtils_1.removeSpecificFileFromUpload)(file.path ?? file.key);
            try {
                const nodeData = {
                    inputs: {
                        [fileInputField]: storagePath
                    },
                    outputs: { output: 'document' }
                };
                let content = '';
                if (isBase64) {
                    content = fileBuffer.toString('base64');
                }
                else {
                    const documents = await fileLoaderNodeInstance.init(nodeData, '', options);
                    content = documents.map((doc) => doc.pageContent).join('\n');
                }
                fileAttachments.push({
                    name: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    content
                });
            }
            catch (error) {
                throw new Error(`Failed operation: createFileAttachment - ${(0, utils_2.getErrorMessage)(error)}`);
            }
        }
    }
    return fileAttachments;
};
exports.createFileAttachment = createFileAttachment;
//# sourceMappingURL=createAttachment.js.map