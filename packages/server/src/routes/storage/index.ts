import express from 'express';
import multer from 'multer';
import { 
    uploadFile, 
    getFileUrl, 
    downloadFile, 
    deleteFile, 
    listFiles, 
    updateFile, 
    searchFiles, 
    moveFileVirtualPath, 
    copyFile,
    uploadUserFile,
    uploadOrganizationFile,
    uploadApplicationFile,
    STORAGE_BUCKETS,
    FILE_CONTEXT_TYPES,
    FILE_RESOURCE_TYPES
} from '../../services/storage';
import { StorageError, StorageErrorCode } from '../../errors';

// Create router
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

// Helper function to get auth context from request
const getAuthContextFromRequest = (req: any) => {
    return {
        userId: req.user?.id,
        orgId: req.headers['x-organization-id'] || req.query.orgId,
        appId: req.headers['x-application-id'] || req.query.appId
    };
};

// Error handler middleware
const handleStorageError = (error: any, res: express.Response) => {
    if (error instanceof StorageError) {
        switch (error.code) {
            case StorageErrorCode.FILE_NOT_FOUND:
                return res.status(404).json({ error: error.message });
            case StorageErrorCode.PERMISSION_DENIED:
                return res.status(403).json({ error: error.message });
            case StorageErrorCode.INVALID_FILE:
            case StorageErrorCode.INVALID_OPERATION:
                return res.status(400).json({ error: error.message });
            case StorageErrorCode.FILE_ALREADY_EXISTS:
                return res.status(409).json({ error: error.message });
            default:
                return res.status(500).json({ error: error.message });
        }
    }
    console.error('Storage error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
};

// Temporary authorize middleware until we import the real one
const authorize = (permission: string) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
        const {
            bucket = STORAGE_BUCKETS.USER_FILES,
            contextType,
            contextId,
            resourceType,
            resourceId,
            isPublic,
            accessLevel,
            metadata,
            virtualPath,
            name,
            contentType
        } = req.body;

        // Upload file
        const result = await uploadFile(
            bucket,
            file.buffer,
            {
                name: name || file.originalname,
                contentType: contentType || file.mimetype,
                contextType: contextType || FILE_CONTEXT_TYPES.USER,
                contextId: contextId || authContext.userId,
                resourceType: resourceType || FILE_RESOURCE_TYPES.DOCUMENT,
                resourceId,
                isPublic: isPublic === 'true' || isPublic === true,
                accessLevel,
                metadata: metadata ? JSON.parse(metadata) : undefined,
                virtualPath
            },
            authContext
        );

        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    } catch (error) {
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
        const {
            resourceType,
            resourceId,
            isPublic,
            accessLevel,
            metadata,
            virtualPath,
            name,
            contentType
        } = req.body;

        // Upload file
        const result = await uploadUserFile(
            userId,
            file.buffer,
            {
                name: name || file.originalname,
                contentType: contentType || file.mimetype,
                resourceType: resourceType || FILE_RESOURCE_TYPES.DOCUMENT,
                resourceId,
                isPublic: isPublic === 'true' || isPublic === true,
                accessLevel,
                metadata: metadata ? JSON.parse(metadata) : undefined,
                virtualPath
            },
            authContext
        );

        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    } catch (error) {
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
        const {
            resourceType,
            resourceId,
            isPublic,
            accessLevel,
            metadata,
            virtualPath,
            name,
            contentType
        } = req.body;

        // Upload file
        const result = await uploadOrganizationFile(
            orgId,
            file.buffer,
            {
                name: name || file.originalname,
                contentType: contentType || file.mimetype,
                resourceType: resourceType || FILE_RESOURCE_TYPES.DOCUMENT,
                resourceId,
                isPublic: isPublic === 'true' || isPublic === true,
                accessLevel,
                metadata: metadata ? JSON.parse(metadata) : undefined,
                virtualPath
            },
            authContext
        );

        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    } catch (error) {
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
        const {
            resourceType,
            resourceId,
            isPublic,
            accessLevel,
            metadata,
            virtualPath,
            name,
            contentType
        } = req.body;

        // Upload file
        const result = await uploadApplicationFile(
            appId,
            file.buffer,
            {
                name: name || file.originalname,
                contentType: contentType || file.mimetype,
                resourceType: resourceType || FILE_RESOURCE_TYPES.DOCUMENT,
                resourceId,
                isPublic: isPublic === 'true' || isPublic === true,
                accessLevel,
                metadata: metadata ? JSON.parse(metadata) : undefined,
                virtualPath
            },
            authContext
        );

        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    } catch (error) {
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
        const url = await getFileUrl(fileId, {
            signed: signed === 'true',
            expiresIn: expiresIn ? parseInt(expiresIn as string) : undefined,
            download: download === 'true' ? true : download as string,
            transform: transform ? JSON.parse(transform as string) : undefined
        });

        // Return URL
        return res.json({
            success: true,
            url
        });
    } catch (error) {
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
        const { data, file } = await downloadFile(fileId);

        // Set headers
        res.setHeader('Content-Type', file.content_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Length', data.size.toString());

        // Send file
        return res.send(Buffer.from(await data.arrayBuffer()));
    } catch (error) {
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
        const deleted = await deleteFile(fileId, authContext);

        // Return result
        return res.json({
            success: true,
            deleted
        });
    } catch (error) {
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
        const {
            limit = '10',
            offset = '0',
            sortBy,
            sortOrder,
            contextType,
            contextId,
            resourceType,
            resourceId,
            isPublic,
            virtualPath
        } = req.query;

        // Build filters
        const filters: Record<string, any> = {};
        if (contextType) filters.context_type = contextType;
        if (contextId) filters.context_id = contextId;
        if (resourceType) filters.resource_type = resourceType;
        if (resourceId) filters.resource_id = resourceId;
        if (isPublic !== undefined) filters.is_public = isPublic === 'true';
        if (virtualPath) filters.virtual_path = virtualPath;

        // Build sort options
        const sort = sortBy 
            ? { 
                column: sortBy as string, 
                order: ((sortOrder as string) || 'asc').toLowerCase() as 'asc' | 'desc'
            } 
            : undefined;

        // List files
        const { files, total } = await listFiles({
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            sortBy: sort,
            filters
        });

        // Return result
        return res.json({
            success: true,
            files,
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });
    } catch (error) {
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
        
        const {
            name,
            contentType,
            isPublic,
            accessLevel,
            metadata,
            virtualPath
        } = req.body;

        // Update file
        const updatedFile = await updateFile(
            fileId,
            {
                name,
                contentType,
                isPublic: isPublic === 'true' || isPublic === true,
                accessLevel,
                metadata: metadata ? JSON.parse(metadata) : undefined,
                virtualPath
            },
            authContext
        );

        // Return result
        return res.json({
            success: true,
            file: updatedFile
        });
    } catch (error) {
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
        const {
            q,
            limit = '10',
            offset = '0',
            contextType,
            contextId,
            resourceType,
            resourceId,
            isPublic,
            virtualPath
        } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Build filters
        const filters: Record<string, any> = {};
        if (contextType) filters.context_type = contextType;
        if (contextId) filters.context_id = contextId;
        if (resourceType) filters.resource_type = resourceType;
        if (resourceId) filters.resource_id = resourceId;
        if (isPublic !== undefined) filters.is_public = isPublic === 'true';
        if (virtualPath) filters.virtual_path = virtualPath;

        // Search files
        const { files, total } = await searchFiles(q as string, {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            filters
        });

        // Return result
        return res.json({
            success: true,
            files,
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });
    } catch (error) {
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
        const updatedFile = await moveFileVirtualPath(fileId, virtualPath, authContext);

        // Return result
        return res.json({
            success: true,
            file: updatedFile
        });
    } catch (error) {
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
        
        const {
            name,
            contentType,
            contextType,
            contextId,
            resourceType,
            resourceId,
            isPublic,
            accessLevel,
            metadata,
            virtualPath
        } = req.body;

        // Copy file
        const result = await copyFile(
            fileId,
            {
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
            },
            authContext
        );

        // Return result
        return res.status(201).json({
            success: true,
            file: result.file,
            url: result.url
        });
    } catch (error) {
        return handleStorageError(error, res);
    }
});

export default router; 