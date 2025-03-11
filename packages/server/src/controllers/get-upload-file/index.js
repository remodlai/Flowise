"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const content_disposition_1 = __importDefault(require("content-disposition"));
const storageUtils_1 = require("@components/storageUtils");
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const fileMetadata_1 = require("../../services/fileMetadata");
const storage_1 = require("../../services/storage");
const errors_1 = require("../../errors");
const streamUploadedFile = async (req, res, next) => {
    try {
        if (!req.query.chatflowId || !req.query.chatId || !req.query.fileName) {
            return res.status(500).send(`Invalid file path`);
        }
        const chatflowId = req.query.chatflowId;
        const chatId = req.query.chatId;
        const fileName = req.query.fileName;
        // Set content disposition header
        res.setHeader('Content-Disposition', (0, content_disposition_1.default)(fileName));
        try {
            // Try to find the file in our database first
            const files = await (0, fileMetadata_1.searchFileMetadata)(fileName, {
                filters: {
                    context_type: 'application',
                    context_id: chatflowId,
                    resource_id: chatId
                }
            });
            if (files.length > 0) {
                // File found in our database, use our storage service
                try {
                    const { data, file } = await (0, storage_1.downloadFile)(files[0].id);
                    // Set headers
                    res.setHeader('Content-Type', file.content_type);
                    // Send file
                    return res.send(Buffer.from(await data.arrayBuffer()));
                }
                catch (error) {
                    console.warn('Error downloading file from storage service, falling back to legacy storage:', error);
                    // Fall back to the old storage method if download fails
                }
            }
        }
        catch (error) {
            console.warn('Error searching for file metadata, falling back to legacy storage:', error);
            // Fall back to the old storage method if search fails
        }
        // Fall back to the old storage method
        const fileStream = await (0, storageUtils_1.streamStorageFile)(chatflowId, chatId, fileName);
        if (!fileStream)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: streamStorageFile`);
        if (fileStream instanceof fs_1.default.ReadStream && fileStream?.pipe) {
            fileStream.pipe(res);
        }
        else {
            res.send(fileStream);
        }
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            // Handle storage errors
            if (error.code === 'FILE_NOT_FOUND') {
                return res.status(404).send(`File not found`);
            }
            return res.status(error.statusCode).send(error.message);
        }
        next(error);
    }
};
exports.default = {
    streamUploadedFile
};
//# sourceMappingURL=index.js.map