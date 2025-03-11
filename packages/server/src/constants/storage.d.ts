/**
 * Storage Constants
 *
 * This file contains constants related to file storage operations.
 * It defines bucket names, access levels, context types, and resource types
 * for use throughout the storage system.
 */
/**
 * Storage bucket definitions for different access levels
 */
export declare const STORAGE_BUCKETS: {
    /** Public bucket for publicly accessible files */
    PUBLIC: string;
    /** Profiles bucket for user profile pictures */
    PROFILES: string;
    /** Platform bucket for platform-level files */
    PLATFORM: string;
    /** Apps bucket for application-specific files */
    APPS: string;
    /** Organizations bucket for organization-specific files */
    ORGANIZATIONS: string;
    /** User files bucket for user-specific files */
    USER_FILES: string;
};
/**
 * File access levels for controlling visibility and permissions
 */
export declare const FILE_ACCESS_LEVELS: {
    /** Private files are only accessible to the owner */
    PRIVATE: string;
    /** Restricted files are accessible to specific users/roles */
    RESTRICTED: string;
    /** Organization files are accessible to all members of an organization */
    ORGANIZATION: string;
    /** Application files are accessible to all users of an application */
    APPLICATION: string;
    /** Public files are accessible to anyone */
    PUBLIC: string;
};
/**
 * Context types for file associations
 */
export declare const FILE_CONTEXT_TYPES: {
    /** Files associated with a user */
    USER: string;
    /** Files associated with an organization */
    ORGANIZATION: string;
    /** Files associated with an application */
    APPLICATION: string;
    /** Files associated with a chatflow */
    CHATFLOW: string;
    /** Files associated with a document */
    DOCUMENT: string;
    /** Files associated with the platform */
    PLATFORM: string;
};
/**
 * Resource types for file categorization
 */
export declare const FILE_RESOURCE_TYPES: {
    /** Profile pictures */
    PROFILE_PICTURE: string;
    /** Document attachments */
    DOCUMENT: string;
    /** Image files */
    IMAGE: string;
    /** Video files */
    VIDEO: string;
    /** Audio files */
    AUDIO: string;
    /** Data files (CSV, JSON, etc.) */
    DATA: string;
    /** Archive files (ZIP, TAR, etc.) */
    ARCHIVE: string;
    /** Other file types */
    OTHER: string;
};
/**
 * Maximum file size limits (in bytes)
 */
export declare const FILE_SIZE_LIMITS: {
    /** Default file size limit (50MB) */
    DEFAULT: number;
    /** Image file size limit (10MB) */
    IMAGE: number;
    /** Document file size limit (25MB) */
    DOCUMENT: number;
    /** Profile picture size limit (5MB) */
    PROFILE_PICTURE: number;
};
/**
 * Allowed file extensions by resource type
 */
export declare const ALLOWED_FILE_EXTENSIONS: {
    IMAGE: string[];
    DOCUMENT: string[];
    AUDIO: string[];
    VIDEO: string[];
    DATA: string[];
    ARCHIVE: string[];
};
/**
 * MIME types for common file extensions
 */
export declare const FILE_MIME_TYPES: {
    '.jpg': string;
    '.jpeg': string;
    '.png': string;
    '.gif': string;
    '.webp': string;
    '.svg': string;
    '.pdf': string;
    '.doc': string;
    '.docx': string;
    '.txt': string;
    '.rtf': string;
    '.md': string;
    '.csv': string;
    '.xls': string;
    '.xlsx': string;
    '.ppt': string;
    '.pptx': string;
    '.mp3': string;
    '.wav': string;
    '.ogg': string;
    '.m4a': string;
    '.flac': string;
    '.mp4': string;
    '.webm': string;
    '.mov': string;
    '.avi': string;
    '.json': string;
    '.xml': string;
    '.yaml': string;
    '.yml': string;
    '.zip': string;
    '.tar': string;
    '.gz': string;
    '.rar': string;
};
/**
 * Virtual path separators for file organization
 */
export declare const VIRTUAL_PATH_SEPARATOR = "/";
/**
 * Default expiration times for signed URLs (in seconds)
 */
export declare const SIGNED_URL_EXPIRATION: {
    /** Short-lived URL (5 minutes) */
    SHORT: number;
    /** Medium-lived URL (1 hour) */
    MEDIUM: number;
    /** Long-lived URL (24 hours) */
    LONG: number;
};
