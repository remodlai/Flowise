"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const storage_1 = require("../../services/storage");
const errors_1 = require("../../errors");
// Create router
const router = express_1.default.Router();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});
// Helper function to get auth context from request
const getAuthContextFromRequest = (req) => {
    return {
        userId: req.user?.id,
        orgId: req.headers['x-organization-id'] || req.query.orgId,
        appId: req.headers['x-application-id'] || req.query.appId
    };
};
// Error handler middleware
const handleStorageError = (error, res) => {
    if (error instanceof errors_1.StorageError) {
        switch (error.code) {
            case errors_1.StorageErrorCode.FILE_NOT_FOUND:
                return res.status(404).json({ error: error.message });
            case errors_1.StorageErrorCode.PERMISSION_DENIED:
                return res.status(403).json({ error: error.message });
            case errors_1.StorageErrorCode.INVALID_FILE:
            case errors_1.StorageErrorCode.INVALID_OPERATION:
                return res.status(400).json({ error: error.message });
            case errors_1.StorageErrorCode.FILE_ALREADY_EXISTS:
                return res.status(409).json({ error: error.message });
            default:
                return res.status(500).json({ error: error.message });
        }
    }
    console.error('Storage error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
};
// Temporary authorize middleware until we import the real one
const authorize = (permission) => {
    return (req, res, next) => {
        // This is a placeholder - the real middleware will check permissions
        next();
    };
};
/**
 * @route POST /api/storage/upload
 * @desc Upload a file
 * @access Private
 */
router.post('/upload', authorize('file.create'), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const authContext = getAuthContextFromRequest(req);
        // Get parameters from request body
        const { bucket = storage_1.STORAGE_BUCKETS.USER_FILES, contextType, contextId, resourceType, resourceId, isPublic, accessLevel, metadata, virtualPath, name, contentType } = req.body;
        // Upload file
        const result = await (0, storage_1.uploadFile)(bucket, file.buffer, {
            name: name || file.originalname,
            contentType: contentType || file.mimetype,
            contextType: contextType || storage_1.FILE_CONTEXT_TYPES.USER,
            contextId: contextId || authContext.userId,
            resourceType: resourceType || storage_1.FILE_RESOURCE_TYPES.DOCUMENT,
            resourceId,
            isPublic: isPublic === 'true' || isPublic === true,
            accessLevel,
            metadata: metadata ? JSON.parse(metadata) : undefined,
            virtualPath
        }, authContext);
        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route POST /api/storage/upload/chat
 * @desc Upload a file specifically for chat
 * @access Private
 */
router.post('/upload/chat', authorize('file.create'), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const authContext = getAuthContextFromRequest(req);
        // Get parameters from request body
        const { chatflowId, chatId, nodeId } = req.body;
        if (!chatflowId || !chatId) {
            return res.status(400).json({ error: 'chatflowId and chatId are required' });
        }
        // Upload file
        const result = await (0, storage_1.uploadApplicationFile)(chatflowId, file.buffer, {
            name: file.originalname,
            contentType: file.mimetype,
            resourceType: file.mimetype.startsWith('image/') ? storage_1.FILE_RESOURCE_TYPES.IMAGE : storage_1.FILE_RESOURCE_TYPES.DOCUMENT,
            resourceId: chatId,
            isPublic: true,
            metadata: {
                originalName: file.originalname,
                chatId: chatId,
                nodeId: nodeId || '',
                size: file.size
            },
            virtualPath: 'uploads'
        }, authContext);
        // Return result
        return res.status(201).json({
            success: true,
            file: {
                id: result.file.id,
                name: result.file.name,
                type: 'stored-file',
                mime: result.file.content_type,
                data: result.file.id // Store the file ID instead of the path
            }
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route POST /api/storage/user/:userId/upload
 * @desc Upload a file for a specific user
 * @access Private
 */
router.post('/user/:userId/upload', authorize('file.create'), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const { userId } = req.params;
        const authContext = getAuthContextFromRequest(req);
        // Get parameters from request body
        const { resourceType, resourceId, isPublic, accessLevel, metadata, virtualPath, name, contentType } = req.body;
        // Upload file
        const result = await (0, storage_1.uploadUserFile)(userId, file.buffer, {
            name: name || file.originalname,
            contentType: contentType || file.mimetype,
            resourceType: resourceType || storage_1.FILE_RESOURCE_TYPES.DOCUMENT,
            resourceId,
            isPublic: isPublic === 'true' || isPublic === true,
            accessLevel,
            metadata: metadata ? JSON.parse(metadata) : undefined,
            virtualPath
        }, authContext);
        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route POST /api/storage/organization/:orgId/upload
 * @desc Upload a file for a specific organization
 * @access Private
 */
router.post('/organization/:orgId/upload', authorize('file.create'), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const { orgId } = req.params;
        const authContext = getAuthContextFromRequest(req);
        // Get parameters from request body
        const { resourceType, resourceId, isPublic, accessLevel, metadata, virtualPath, name, contentType } = req.body;
        // Upload file
        const result = await (0, storage_1.uploadOrganizationFile)(orgId, file.buffer, {
            name: name || file.originalname,
            contentType: contentType || file.mimetype,
            resourceType: resourceType || storage_1.FILE_RESOURCE_TYPES.DOCUMENT,
            resourceId,
            isPublic: isPublic === 'true' || isPublic === true,
            accessLevel,
            metadata: metadata ? JSON.parse(metadata) : undefined,
            virtualPath
        }, authContext);
        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route POST /api/storage/application/:appId/upload
 * @desc Upload a file for a specific application
 * @access Private
 */
router.post('/application/:appId/upload', authorize('file.create'), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const { appId } = req.params;
        const authContext = getAuthContextFromRequest(req);
        // Get parameters from request body
        const { resourceType, resourceId, isPublic, accessLevel, metadata, virtualPath, name, contentType } = req.body;
        // Upload file
        const result = await (0, storage_1.uploadApplicationFile)(appId, file.buffer, {
            name: name || file.originalname,
            contentType: contentType || file.mimetype,
            resourceType: resourceType || storage_1.FILE_RESOURCE_TYPES.DOCUMENT,
            resourceId,
            isPublic: isPublic === 'true' || isPublic === true,
            accessLevel,
            metadata: metadata ? JSON.parse(metadata) : undefined,
            virtualPath
        }, authContext);
        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route GET /api/storage/file/:fileId/url
 * @desc Get a file URL (public or signed)
 * @access Private
 */
router.get('/file/:fileId/url', authorize('file.read'), async (req, res) => {
    try {
        const { fileId } = req.params;
        const { signed, expiresIn, download, transform } = req.query;
        // Get file URL
        const url = await (0, storage_1.getFileUrl)(fileId, {
            signed: signed === 'true',
            expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
            download: download === 'true' ? true : download,
            transform: transform ? JSON.parse(transform) : undefined
        });
        // Return URL
        return res.json({
            success: true,
            url
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route GET /api/storage/file/:fileId/download
 * @desc Download a file
 * @access Private
 */
router.get('/file/:fileId/download', authorize('file.read'), async (req, res) => {
    try {
        const { fileId } = req.params;
        // Download file
        const { data, file } = await (0, storage_1.downloadFile)(fileId);
        // Set headers
        res.setHeader('Content-Type', file.content_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Length', data.size.toString());
        // Send file
        return res.send(Buffer.from(await data.arrayBuffer()));
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route DELETE /api/storage/file/:fileId
 * @desc Delete a file
 * @access Private
 */
router.delete('/file/:fileId', authorize('file.delete'), async (req, res) => {
    try {
        const { fileId } = req.params;
        const authContext = getAuthContextFromRequest(req);
        // Delete file
        const deleted = await (0, storage_1.deleteFile)(fileId, authContext);
        // Return result
        return res.json({
            success: true,
            deleted
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route GET /api/storage/files
 * @desc List files
 * @access Private
 */
router.get('/files', authorize('file.read'), async (req, res) => {
    try {
        const { limit = '10', offset = '0', sortBy, sortOrder, contextType, contextId, resourceType, resourceId, isPublic, virtualPath } = req.query;
        // Build filters
        const filters = {};
        if (contextType)
            filters.context_type = contextType;
        if (contextId)
            filters.context_id = contextId;
        if (resourceType)
            filters.resource_type = resourceType;
        if (resourceId)
            filters.resource_id = resourceId;
        if (isPublic !== undefined)
            filters.is_public = isPublic === 'true';
        if (virtualPath)
            filters.virtual_path = virtualPath;
        // Build sort options
        const sort = sortBy
            ? {
                column: sortBy,
                order: (sortOrder || 'asc').toLowerCase()
            }
            : undefined;
        // List files
        const { files, total } = await (0, storage_1.listFiles)({
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy: sort,
            filters
        });
        // Return result
        return res.json({
            success: true,
            files,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route PATCH /api/storage/file/:fileId
 * @desc Update a file
 * @access Private
 */
router.patch('/file/:fileId', authorize('file.update'), async (req, res) => {
    try {
        const { fileId } = req.params;
        const authContext = getAuthContextFromRequest(req);
        const { name, contentType, isPublic, accessLevel, metadata, virtualPath } = req.body;
        // Update file
        const updatedFile = await (0, storage_1.updateFile)(fileId, {
            name,
            contentType,
            isPublic: isPublic === 'true' || isPublic === true,
            accessLevel,
            metadata: metadata ? JSON.parse(metadata) : undefined,
            virtualPath
        }, authContext);
        // Return result
        return res.json({
            success: true,
            file: updatedFile
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route GET /api/storage/search
 * @desc Search files
 * @access Private
 */
router.get('/search', authorize('file.read'), async (req, res) => {
    try {
        const { q, limit = '10', offset = '0', contextType, contextId, resourceType, resourceId, isPublic, virtualPath } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        // Build filters
        const filters = {};
        if (contextType)
            filters.context_type = contextType;
        if (contextId)
            filters.context_id = contextId;
        if (resourceType)
            filters.resource_type = resourceType;
        if (resourceId)
            filters.resource_id = resourceId;
        if (isPublic !== undefined)
            filters.is_public = isPublic === 'true';
        if (virtualPath)
            filters.virtual_path = virtualPath;
        // Search files
        const { files, total } = await (0, storage_1.searchFiles)(q, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            filters
        });
        // Return result
        return res.json({
            success: true,
            files,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route PATCH /api/storage/file/:fileId/move
 * @desc Move a file to a new virtual path
 * @access Private
 */
router.patch('/file/:fileId/move', authorize('file.update'), async (req, res) => {
    try {
        const { fileId } = req.params;
        const { virtualPath } = req.body;
        const authContext = getAuthContextFromRequest(req);
        if (!virtualPath) {
            return res.status(400).json({ error: 'Virtual path is required' });
        }
        // Move file
        const updatedFile = await (0, storage_1.moveFileVirtualPath)(fileId, virtualPath, authContext);
        // Return result
        return res.json({
            success: true,
            file: updatedFile
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
/**
 * @route POST /api/storage/file/:fileId/copy
 * @desc Copy a file
 * @access Private
 */
router.post('/file/:fileId/copy', authorize('file.create'), async (req, res) => {
    try {
        const { fileId } = req.params;
        const authContext = getAuthContextFromRequest(req);
        const { name, contentType, contextType, contextId, resourceType, resourceId, isPublic, accessLevel, metadata, virtualPath } = req.body;
        // Copy file
        const result = await (0, storage_1.copyFile)(fileId, {
            name,
            contentType,
            contextType,
            contextId,
            resourceType,
            resourceId,
            isPublic: isPublic === 'true' || isPublic === true,
            accessLevel,
            metadata: metadata ? JSON.parse(metadata) : undefined,
            virtualPath
        }, authContext);
        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    }
    catch (error) {
        return handleStorageError(error, res);
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map