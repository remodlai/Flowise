"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_RESOURCE_TYPES = void 0;
exports.uploadApplicationFile = uploadApplicationFile;
const errors_1 = require("./errors");
/**
 * Enum for file resource types
 */
var FILE_RESOURCE_TYPES;
(function (FILE_RESOURCE_TYPES) {
    FILE_RESOURCE_TYPES["IMAGE"] = "image";
    FILE_RESOURCE_TYPES["DOCUMENT"] = "document";
    FILE_RESOURCE_TYPES["AUDIO"] = "audio";
    FILE_RESOURCE_TYPES["VIDEO"] = "video";
    FILE_RESOURCE_TYPES["OTHER"] = "other";
})(FILE_RESOURCE_TYPES || (exports.FILE_RESOURCE_TYPES = FILE_RESOURCE_TYPES = {}));
/**
 * Uploads a file to the application's storage
 * This is a simplified version that will be replaced by the actual implementation
 */
async function uploadApplicationFile(applicationId, fileBuffer, options, authContext) {
    try {
        // This is a placeholder implementation
        // In a real implementation, this would upload to a storage service
        // For now, just return a data URL as fallback
        const base64 = fileBuffer.toString('base64');
        const url = `data:${options.contentType};base64,${base64}`;
        return {
            url,
            path: `${options.virtualPath}/${options.name}`,
            metadata: options.metadata
        };
    }
    catch (error) {
        throw new errors_1.StorageError(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=storageService.js.map