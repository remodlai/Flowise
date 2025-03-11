/**
 * Base error class for all component errors
 */
export class ComponentError extends Error {
    code: string;
    
    constructor(message: string, code: string = 'COMPONENT_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}

/**
 * Error related to storage operations
 */
export class StorageError extends ComponentError {
    constructor(message: string, code: string = 'STORAGE_ERROR') {
        super(message, code);
    }
} 