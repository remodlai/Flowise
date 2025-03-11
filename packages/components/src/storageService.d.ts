/**
 * Enum for file resource types
 */
export declare enum FILE_RESOURCE_TYPES {
    IMAGE = "image",
    DOCUMENT = "document",
    AUDIO = "audio",
    VIDEO = "video",
    OTHER = "other"
}
/**
 * Interface for file upload options
 */
export interface IFileUploadOptions {
    name: string;
    contentType: string;
    resourceType: FILE_RESOURCE_TYPES;
    resourceId?: string;
    isPublic?: boolean;
    metadata?: Record<string, any>;
    virtualPath?: string;
}
/**
 * Interface for authentication context
 */
export interface IAuthContext {
    userId?: string;
    orgId?: string;
    appId?: string;
}
/**
 * Interface for upload result
 */
export interface IUploadResult {
    url?: string;
    path?: string;
    id?: string;
    metadata?: Record<string, any>;
}
/**
 * Uploads a file to the application's storage
 * This is a simplified version that will be replaced by the actual implementation
 */
export declare function uploadApplicationFile(applicationId: string, fileBuffer: Buffer, options: IFileUploadOptions, authContext?: IAuthContext): Promise<IUploadResult>;
