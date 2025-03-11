/**
 * Supabase Storage Utilities
 *
 * This file contains utilities for interacting with Supabase Storage.
 * It provides functions for uploading, retrieving, and managing files
 * across different storage buckets with appropriate access control.
 */
/**
 * Storage bucket definitions for different access levels
 * - PUBLIC: Accessible to anyone, used for public assets
 * - PROFILES: For user profile pictures with specific access control
 * - PLATFORM: Platform-level files accessible to platform admins
 * - APPS: App-specific files accessible to app owners and users
 * - ORGANIZATIONS: Organization-specific files for org members
 * - USER_FILES: User-specific files with personal access control
 */
export declare const STORAGE_BUCKETS: {
    PUBLIC: string;
    PROFILES: string;
    PLATFORM: string;
    APPS: string;
    ORGANIZATIONS: string;
    USER_FILES: string;
};
/**
 * Uploads a file to Supabase Storage
 *
 * @param bucket - The storage bucket to upload to
 * @param path - The path within the bucket
 * @param file - The file buffer to upload
 * @param fileOptions - Options for the file upload
 * @param fileOptions.contentType - MIME type of the file
 * @param fileOptions.fileName - Optional custom filename (defaults to UUID)
 * @param fileOptions.isPublic - Whether to return a public URL (defaults to false)
 * @returns Object containing the file path and optional public URL
 */
export declare const uploadFile: (bucket: string, path: string, file: Buffer, fileOptions: {
    contentType: string;
    fileName?: string;
    isPublic?: boolean;
}) => Promise<{
    path: string;
    publicUrl?: string;
}>;
/**
 * Uploads and optionally transforms an image to Supabase Storage
 *
 * @param bucket - The storage bucket to upload to
 * @param path - The path within the bucket
 * @param file - The image buffer to upload
 * @param fileOptions - Options for the image upload and transformation
 * @param fileOptions.contentType - MIME type of the image
 * @param fileOptions.fileName - Optional custom filename (defaults to UUID)
 * @param fileOptions.isPublic - Whether to return a public URL (defaults to false)
 * @param fileOptions.width - Optional width to resize the image to
 * @param fileOptions.height - Optional height to resize the image to
 * @param fileOptions.quality - Optional quality setting for JPEG/WebP (1-100)
 * @returns Object containing the file path and optional public URL
 */
export declare const uploadImage: (bucket: string, path: string, file: Buffer, fileOptions: {
    contentType: string;
    fileName?: string;
    isPublic?: boolean;
    width?: number;
    height?: number;
    quality?: number;
}) => Promise<{
    path: string;
    publicUrl?: string;
}>;
/**
 * Retrieves a file from Supabase Storage
 *
 * @param bucket - The storage bucket to retrieve from
 * @param path - The path of the file within the bucket
 * @returns The file data as an ArrayBuffer or null if not found
 */
export declare const getFile: (bucket: string, path: string) => Promise<any>;
/**
 * Generates a signed URL for temporary access to a file
 *
 * @param bucket - The storage bucket containing the file
 * @param path - The path of the file within the bucket
 * @param expiresIn - Number of seconds until the URL expires (default: 60)
 * @returns The signed URL or null if generation fails
 */
export declare const getSignedUrl: (bucket: string, path: string, expiresIn?: number) => Promise<any>;
/**
 * Lists files in a specific path within a bucket
 *
 * @param bucket - The storage bucket to list files from
 * @param path - The path within the bucket to list files from
 * @returns List of files
 */
export declare const listFiles: (bucket: string, path: string) => Promise<any[]>;
/**
 * Deletes a file from Supabase Storage
 *
 * @param bucket - The storage bucket containing the file
 * @param path - The path of the file to delete
 * @returns Boolean indicating success or failure
 */
export declare const deleteFile: (bucket: string, path: string) => Promise<boolean>;
/**
 * Moves a file from one location to another within Supabase Storage
 *
 * @param bucket - The storage bucket containing the file
 * @param fromPath - The current path of the file
 * @param toPath - The destination path for the file
 * @returns Boolean indicating success or failure
 */
export declare const moveFile: (bucket: string, fromPath: string, toPath: string) => Promise<boolean>;
/**
 * Generates a storage path and bucket based on the context
 *
 * @param options - Options for generating the storage path
 * @param options.level - The level of the storage path (platform, app, organization, user)
 * @param options.id - The ID of the entity (application ID, organization ID, user ID)
 * @param options.subPath - Optional sub-path within the entity's storage
 * @returns Object containing the bucket and path
 */
export declare const generateStoragePath: (options: {
    level: "platform" | "app" | "organization" | "user";
    id: string;
    subPath?: string;
    application_id?: string;
}) => {
    bucket: string;
    path: string;
};
/**
 * Generates a storage path for application-specific files
 *
 * @param applicationId - The ID of the application
 * @param subPath - Optional sub-path within the application's storage
 * @returns Object containing the bucket and path
 */
export declare const generateApplicationStoragePath: (applicationId: string, subPath?: string) => {
    bucket: string;
    path: string;
};
/**
 * Generates a storage path for organization-specific files
 *
 * @param organizationId - The ID of the organization
 * @param applicationId - Optional application ID for context
 * @param subPath - Optional sub-path within the organization's storage
 * @returns Object containing the bucket and path
 */
export declare const generateOrganizationStoragePath: (organizationId: string, applicationId?: string, subPath?: string) => {
    bucket: string;
    path: string;
};
/**
 * Generates a storage path for user-specific files
 *
 * @param userId - The ID of the user
 * @param applicationId - Optional application ID for context
 * @param subPath - Optional sub-path within the user's storage
 * @returns Object containing the bucket and path
 */
export declare const generateUserStoragePath: (userId: string, applicationId?: string, subPath?: string) => {
    bucket: string;
    path: string;
};
