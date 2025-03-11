"use strict";
/**
 * Storage Path Utilities
 *
 * This file provides utilities for generating and validating storage paths
 * for different contexts and resource types.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileExtension = exports.getDirPathFromPath = exports.getFilenameFromPath = exports.generateVirtualPath = exports.generatePlatformStoragePath = exports.generateDocumentStoragePath = exports.generateChatflowStoragePath = exports.generateApplicationStoragePath = exports.generateOrganizationStoragePath = exports.generateUserStoragePath = exports.generateStoragePath = exports.generateUniqueFilename = exports.sanitizeFilename = exports.isValidStoragePath = void 0;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const storage_1 = require("../constants/storage");
const errors_1 = require("../errors");
/**
 * Validates a storage path to ensure it meets requirements
 *
 * @param path - The path to validate
 * @returns True if the path is valid, false otherwise
 */
const isValidStoragePath = (path) => {
    // Path must not be empty
    if (!path || path.trim() === '') {
        return false;
    }
    // Path must not contain invalid characters
    const invalidCharsRegex = /[<>:"|?*\x00-\x1F]/g;
    if (invalidCharsRegex.test(path)) {
        return false;
    }
    // Path must not start or end with a slash
    if (path.startsWith('/') || path.endsWith('/')) {
        return false;
    }
    // Path must not contain consecutive slashes
    if (path.includes('//')) {
        return false;
    }
    // Path must not be too long (max 1024 characters)
    if (path.length > 1024) {
        return false;
    }
    return true;
};
exports.isValidStoragePath = isValidStoragePath;
/**
 * Sanitizes a filename to ensure it's safe for storage
 *
 * @param filename - The filename to sanitize
 * @returns The sanitized filename
 */
const sanitizeFilename = (filename) => {
    if (!filename)
        return '';
    // Remove invalid characters
    let sanitized = filename.replace(/[<>:"|?*\x00-\x1F]/g, '');
    // Replace spaces with underscores
    sanitized = sanitized.replace(/\s+/g, '_');
    // Ensure filename isn't too long (max 255 characters)
    if (sanitized.length > 255) {
        const extension = path_1.default.extname(sanitized);
        const basename = path_1.default.basename(sanitized, extension);
        sanitized = basename.substring(0, 245) + extension;
    }
    return sanitized;
};
exports.sanitizeFilename = sanitizeFilename;
/**
 * Generates a unique filename with a UUID
 *
 * @param originalFilename - The original filename (optional)
 * @returns A unique filename
 */
const generateUniqueFilename = (originalFilename) => {
    const uuid = (0, uuid_1.v4)();
    if (!originalFilename) {
        return uuid;
    }
    const sanitized = (0, exports.sanitizeFilename)(originalFilename);
    if (!sanitized) {
        return uuid;
    }
    const extension = path_1.default.extname(sanitized);
    const basename = path_1.default.basename(sanitized, extension);
    return `${basename}_${uuid}${extension}`;
};
exports.generateUniqueFilename = generateUniqueFilename;
/**
 * Generates a storage path based on the provided options
 *
 * @param options - Options for generating the path
 * @returns The generated storage path
 * @throws StorageError if the path is invalid
 */
const generateStoragePath = (options) => {
    const { contextType, contextId, resourceType = storage_1.FILE_RESOURCE_TYPES.OTHER, resourceId, includeUuid = true, folderName, originalFilename } = options;
    // Validate required parameters
    if (!contextType || !contextId) {
        throw (0, errors_1.createInvalidFileError)('Context type and context ID are required for generating a storage path');
    }
    // Start building the path
    const pathParts = [];
    // Add context type and ID
    pathParts.push(contextType);
    pathParts.push(contextId);
    // Add resource type
    pathParts.push(resourceType);
    // Add resource ID if provided
    if (resourceId) {
        pathParts.push(resourceId);
    }
    // Add custom folder if provided
    if (folderName) {
        pathParts.push((0, exports.sanitizeFilename)(folderName));
    }
    // Create the directory path
    const dirPath = pathParts.join('/');
    // Generate filename
    let filename;
    if (includeUuid) {
        filename = (0, exports.generateUniqueFilename)(originalFilename);
    }
    else if (originalFilename) {
        filename = (0, exports.sanitizeFilename)(originalFilename);
    }
    else {
        filename = (0, uuid_1.v4)();
    }
    // Combine directory path and filename
    const fullPath = `${dirPath}/${filename}`;
    // Validate the final path
    if (!(0, exports.isValidStoragePath)(fullPath)) {
        throw (0, errors_1.createInvalidFileError)(`Generated path "${fullPath}" is invalid`);
    }
    return fullPath;
};
exports.generateStoragePath = generateStoragePath;
/**
 * Generates a storage path for a user context
 *
 * @param userId - The ID of the user
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
const generateUserStoragePath = (userId, resourceType = storage_1.FILE_RESOURCE_TYPES.OTHER, options = {}) => {
    return (0, exports.generateStoragePath)({
        contextType: storage_1.FILE_CONTEXT_TYPES.USER,
        contextId: userId,
        resourceType,
        ...options
    });
};
exports.generateUserStoragePath = generateUserStoragePath;
/**
 * Generates a storage path for an organization context
 *
 * @param organizationId - The ID of the organization
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
const generateOrganizationStoragePath = (organizationId, resourceType = storage_1.FILE_RESOURCE_TYPES.OTHER, options = {}) => {
    return (0, exports.generateStoragePath)({
        contextType: storage_1.FILE_CONTEXT_TYPES.ORGANIZATION,
        contextId: organizationId,
        resourceType,
        ...options
    });
};
exports.generateOrganizationStoragePath = generateOrganizationStoragePath;
/**
 * Generates a storage path for an application context
 *
 * @param applicationId - The ID of the application
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
const generateApplicationStoragePath = (applicationId, resourceType = storage_1.FILE_RESOURCE_TYPES.OTHER, options = {}) => {
    return (0, exports.generateStoragePath)({
        contextType: storage_1.FILE_CONTEXT_TYPES.APPLICATION,
        contextId: applicationId,
        resourceType,
        ...options
    });
};
exports.generateApplicationStoragePath = generateApplicationStoragePath;
/**
 * Generates a storage path for a chatflow context
 *
 * @param chatflowId - The ID of the chatflow
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
const generateChatflowStoragePath = (chatflowId, resourceType = storage_1.FILE_RESOURCE_TYPES.OTHER, options = {}) => {
    return (0, exports.generateStoragePath)({
        contextType: storage_1.FILE_CONTEXT_TYPES.CHATFLOW,
        contextId: chatflowId,
        resourceType,
        ...options
    });
};
exports.generateChatflowStoragePath = generateChatflowStoragePath;
/**
 * Generates a storage path for a document context
 *
 * @param documentId - The ID of the document
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
const generateDocumentStoragePath = (documentId, resourceType = storage_1.FILE_RESOURCE_TYPES.DOCUMENT, options = {}) => {
    return (0, exports.generateStoragePath)({
        contextType: storage_1.FILE_CONTEXT_TYPES.DOCUMENT,
        contextId: documentId,
        resourceType,
        ...options
    });
};
exports.generateDocumentStoragePath = generateDocumentStoragePath;
/**
 * Generates a storage path for a platform context
 *
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
const generatePlatformStoragePath = (resourceType = storage_1.FILE_RESOURCE_TYPES.OTHER, options = {}) => {
    return (0, exports.generateStoragePath)({
        contextType: storage_1.FILE_CONTEXT_TYPES.PLATFORM,
        contextId: 'global',
        resourceType,
        ...options
    });
};
exports.generatePlatformStoragePath = generatePlatformStoragePath;
/**
 * Generates a virtual path for organizing files in the UI
 *
 * @param parts - The parts of the virtual path
 * @returns The generated virtual path
 */
const generateVirtualPath = (...parts) => {
    // Filter out empty parts
    const validParts = parts.filter(part => part && part.trim() !== '');
    // Join parts with the virtual path separator
    return validParts.join(storage_1.VIRTUAL_PATH_SEPARATOR);
};
exports.generateVirtualPath = generateVirtualPath;
/**
 * Extracts the filename from a storage path
 *
 * @param storagePath - The storage path
 * @returns The extracted filename
 */
const getFilenameFromPath = (storagePath) => {
    if (!storagePath)
        return '';
    return storagePath.split('/').pop() || '';
};
exports.getFilenameFromPath = getFilenameFromPath;
/**
 * Extracts the directory path from a storage path
 *
 * @param storagePath - The storage path
 * @returns The extracted directory path
 */
const getDirPathFromPath = (storagePath) => {
    if (!storagePath)
        return '';
    const parts = storagePath.split('/');
    parts.pop(); // Remove filename
    return parts.join('/');
};
exports.getDirPathFromPath = getDirPathFromPath;
/**
 * Gets the file extension from a filename
 *
 * @param filename - The filename
 * @returns The file extension (with dot)
 */
const getFileExtension = (filename) => {
    if (!filename)
        return '';
    return path_1.default.extname(filename).toLowerCase();
};
exports.getFileExtension = getFileExtension;
//# sourceMappingURL=storagePath.js.map