"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageError = exports.ComponentError = void 0;
/**
 * Base error class for all component errors
 */
class ComponentError extends Error {
    constructor(message, code = 'COMPONENT_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}
exports.ComponentError = ComponentError;
/**
 * Error related to storage operations
 */
class StorageError extends ComponentError {
    constructor(message, code = 'STORAGE_ERROR') {
        super(message, code);
    }
}
exports.StorageError = StorageError;
//# sourceMappingURL=errors.js.map