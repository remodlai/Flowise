/**
 * Storage Path Utilities
 *
 * This file provides utilities for generating and validating storage paths
 * for different contexts and resource types.
 */
/**
 * Options for generating a storage path
 */
export interface StoragePathOptions {
    /** The context type (user, organization, application, etc.) */
    contextType: string;
    /** The ID of the context (user ID, organization ID, etc.) */
    contextId: string;
    /** The type of resource (profile_picture, document, image, etc.) */
    resourceType?: string;
    /** The ID of the resource (if applicable) */
    resourceId?: string;
    /** Whether to include a UUID in the path for uniqueness */
    includeUuid?: boolean;
    /** Custom folder name to include in the path */
    folderName?: string;
    /** Original filename to preserve (optional) */
    originalFilename?: string;
}
/**
 * Validates a storage path to ensure it meets requirements
 *
 * @param path - The path to validate
 * @returns True if the path is valid, false otherwise
 */
export declare const isValidStoragePath: (path: string) => boolean;
/**
 * Sanitizes a filename to ensure it's safe for storage
 *
 * @param filename - The filename to sanitize
 * @returns The sanitized filename
 */
export declare const sanitizeFilename: (filename: string) => string;
/**
 * Generates a unique filename with a UUID
 *
 * @param originalFilename - The original filename (optional)
 * @returns A unique filename
 */
export declare const generateUniqueFilename: (originalFilename?: string) => string;
/**
 * Generates a storage path based on the provided options
 *
 * @param options - Options for generating the path
 * @returns The generated storage path
 * @throws StorageError if the path is invalid
 */
export declare const generateStoragePath: (options: StoragePathOptions) => string;
/**
 * Generates a storage path for a user context
 *
 * @param userId - The ID of the user
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export declare const generateUserStoragePath: (userId: string, resourceType?: string, options?: Partial<StoragePathOptions>) => string;
/**
 * Generates a storage path for an organization context
 *
 * @param organizationId - The ID of the organization
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export declare const generateOrganizationStoragePath: (organizationId: string, resourceType?: string, options?: Partial<StoragePathOptions>) => string;
/**
 * Generates a storage path for an application context
 *
 * @param applicationId - The ID of the application
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export declare const generateApplicationStoragePath: (applicationId: string, resourceType?: string, options?: Partial<StoragePathOptions>) => string;
/**
 * Generates a storage path for a chatflow context
 *
 * @param chatflowId - The ID of the chatflow
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export declare const generateChatflowStoragePath: (chatflowId: string, resourceType?: string, options?: Partial<StoragePathOptions>) => string;
/**
 * Generates a storage path for a document context
 *
 * @param documentId - The ID of the document
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export declare const generateDocumentStoragePath: (documentId: string, resourceType?: string, options?: Partial<StoragePathOptions>) => string;
/**
 * Generates a storage path for a platform context
 *
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export declare const generatePlatformStoragePath: (resourceType?: string, options?: Partial<StoragePathOptions>) => string;
/**
 * Generates a virtual path for organizing files in the UI
 *
 * @param parts - The parts of the virtual path
 * @returns The generated virtual path
 */
export declare const generateVirtualPath: (...parts: string[]) => string;
/**
 * Extracts the filename from a storage path
 *
 * @param storagePath - The storage path
 * @returns The extracted filename
 */
export declare const getFilenameFromPath: (storagePath: string) => string;
/**
 * Extracts the directory path from a storage path
 *
 * @param storagePath - The storage path
 * @returns The extracted directory path
 */
export declare const getDirPathFromPath: (storagePath: string) => string;
/**
 * Gets the file extension from a filename
 *
 * @param filename - The filename
 * @returns The file extension (with dot)
 */
export declare const getFileExtension: (filename: string) => string;
