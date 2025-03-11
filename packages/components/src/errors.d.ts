/**
 * Base error class for all component errors
 */
export declare class ComponentError extends Error {
    code: string;
    constructor(message: string, code?: string);
}
/**
 * Error related to storage operations
 */
export declare class StorageError extends ComponentError {
    constructor(message: string, code?: string);
}
