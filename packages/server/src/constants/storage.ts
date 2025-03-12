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
export const STORAGE_BUCKETS = {
  /** Public bucket for publicly accessible files */
  PUBLIC: 'public',
  
  /** Profiles bucket for user profile pictures */
  PROFILES: 'profiles',
  
  /** Platform bucket for platform-level files */
  PLATFORM: 'platform',
  
  /** Apps bucket for application-specific files */
  APPS: 'apps',
  
  /** Organizations bucket for organization-specific files */
  ORGANIZATIONS: 'organizations',
  
  /** User files bucket for user-specific files */
  USER_FILES: 'user-files'
}

/**
 * File access levels for controlling visibility and permissions
 */
export const FILE_ACCESS_LEVELS = {
  /** Private files are only accessible to the owner */
  PRIVATE: 'private',
  
  /** Restricted files are accessible to specific users/roles */
  RESTRICTED: 'restricted',
  
  /** Organization files are accessible to all members of an organization */
  ORGANIZATION: 'organization',
  
  /** Application files are accessible to all users of an application */
  APPLICATION: 'application',
  
  /** Public files are accessible to anyone */
  PUBLIC: 'public'
}

/**
 * Context types for file associations
 */
export const FILE_CONTEXT_TYPES = {
  /** Files associated with a user */
  USER: 'user',
  
  /** Files associated with an organization */
  ORGANIZATION: 'organization',
  
  /** Files associated with an application */
  APPLICATION: 'application',
  
  /** Files associated with a chatflow */
  CHATFLOW: 'chatflow',
  
  /** Files associated with a document */
  DOCUMENT: 'document',
  
  /** Files associated with the platform */
  PLATFORM: 'platform'
}

/**
 * Resource types for file categorization
 */
export const FILE_RESOURCE_TYPES = {
  /** Profile pictures */
  PROFILE_PICTURE: 'profile_picture',
  
  /** Document attachments */
  DOCUMENT: 'document',
  
  /** Image files */
  IMAGE: 'image',
  
  /** Video files */
  VIDEO: 'video',
  
  /** Audio files */
  AUDIO: 'audio',
  
  /** Data files (CSV, JSON, etc.) */
  DATA: 'data',
  
  /** Archive files (ZIP, TAR, etc.) */
  ARCHIVE: 'archive',
  
  /** Other file types */
  OTHER: 'other'
}

/**
 * Maximum file size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  /** Default file size limit (50MB) */
  DEFAULT: 52428800,
  
  /** Image file size limit (10MB) */
  IMAGE: 10485760,
  
  /** Document file size limit (25MB) */
  DOCUMENT: 26214400,
  
  /** Profile picture size limit (5MB) */
  PROFILE_PICTURE: 5242880
}

/**
 * Allowed file extensions by resource type
 */
export const ALLOWED_FILE_EXTENSIONS = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.md', '.csv', '.xls', '.xlsx', '.ppt', '.pptx'],
  AUDIO: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  VIDEO: ['.mp4', '.webm', '.mov', '.avi'],
  DATA: ['.json', '.csv', '.xml', '.yaml', '.yml'],
  ARCHIVE: ['.zip', '.tar', '.gz', '.rar']
}

/**
 * MIME types for common file extensions
 */
export const FILE_MIME_TYPES = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/m4a',
  '.flac': 'audio/flac',
  
  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  
  // Data
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  
  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/vnd.rar'
}

/**
 * Virtual path separators for file organization
 * @desc when presented with a path string, this is the separator used to split the path into tokens
 */
export const PATH_TOKEN_SEPARATOR = '/'

/**
 * Path token utility functions for working with path_tokens arrays
 */
export const PATH_TOKEN_FUNCTIONS = {
  /**
   * Convert a path string to path tokens array
   * @param path Path string
   * @returns Array of path tokens e.g. ['new', 'path', 'to', 'file.jpg']
   */
  pathToTokens: (path: string): string[] => {
    if (!path) return []
    return path.split(PATH_TOKEN_SEPARATOR).filter(Boolean)
  },

  /**
   * Convert path tokens array to path string
   * @param tokens Array of path tokens e.g. ['new', 'path', 'to', 'file.jpg']
   * @returns Path string e.g. 'new/path/to/file.jpg'
   */
  tokensToPath: (tokens: string[]): string => {
    if (!tokens || !tokens.length) return ''
    return tokens.join(PATH_TOKEN_SEPARATOR)
  },

  /**
   * Get parent path tokens (remove the last token)
   * @param tokens Array of path tokens e.g. ['new', 'path', 'to', 'file.jpg']
   * @returns Parent path tokens e.g. ['new', 'path', 'to']
   */
  getParentTokens: (tokens: string[]): string[] => {
    if (!tokens || tokens.length <= 1) return []
    return tokens.slice(0, -1)
  }
}

/**
 * Default expiration times for signed URLs (in seconds)
 */
export const SIGNED_URL_EXPIRATION = {
  /** Short-lived URL (1 week) */
  SHORT: 604800,
  
  /** Medium-lived URL (1 month) */
  MEDIUM: 2592000, // 1 month
  
  /** Long-lived URL (1 year) */
  LONG: 31536000 // 1 year
} 