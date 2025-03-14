/**
 * CaseMaker is a utility class for converting strings between camelCase and snake_case.
 * It provides methods to check if a string is in camelCase or snake_case, and to convert between the two.
 * We use this to safely convert between the two cases for database column names.
 */

import { getCaseConverter } from './helpers/converter';
import { camelCase, snakeCase } from './helpers/index';

export class CaseMaker {

    /**
     * Check if a string is in camelCase.
     * @param str - The string to check.
     * @returns True if the string is in camelCase, false otherwise.
     */
    isCamelCase(str: string) {
        return str === camelCase(str);
    }

    /**
     * Check if a string is in snake_case.
     * @param str - The string to check.
     * @returns True if the string is in snake_case, false otherwise.
     */
    isSnakeCase(str: string) {
        return str === snakeCase(str);
    }

    /**
     * Convert a string from snake_case to camelCase.
     * @param str - The string to convert.
     * @returns The converted string in camelCase.
     */
    toCamelCase(str: string) {
        const camelCase = getCaseConverter('camelCase')(str);
        return camelCase.output;
    }

    /**
     * Convert a string from camelCase to snake_case.
     * @param str - The string to convert.
     * @returns The converted string in snake_case.
     */
    toSnakeCase(str: string) {
        const snakeCase = getCaseConverter('snakeCase')(str);
        return snakeCase.output;
    }

    /**
     * Transform all keys in an object from snake_case to camelCase.
     * Handles nested objects and arrays.
     * @param obj - The object to transform.
     * @returns A new object with all keys in camelCase.
     */
    objectToCamelCase<T extends object>(obj: T): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.objectToCamelCase(item));
        }

        return Object.entries(obj).reduce((result, [key, value]) => {
            const camelKey = this.toCamelCase(key);
            result[camelKey] = this.objectToCamelCase(value);
            return result;
        }, {} as any);
    }

    /**
     * Transform all keys in an object from camelCase to snake_case.
     * Handles nested objects and arrays.
     * @param obj - The object to transform.
     * @returns A new object with all keys in snake_case.
     */
    objectToSnakeCase<T extends object>(obj: T): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.objectToSnakeCase(item));
        }

        return Object.entries(obj).reduce((result, [key, value]) => {
            const snakeKey = this.toSnakeCase(key);
            result[snakeKey] = this.objectToSnakeCase(value);
            return result;
        }, {} as any);
    }

    toConstantCase(str: string) {
        const constantCase = getCaseConverter('constantCase')(str);
        return constantCase.output;
    }

    /**
     * Convert a string from snake_case to dotCase.
     * @param str - The string to convert.
     * @returns The converted string in dotCase.
     */
    toDotCase(str: string) {
        const dotCase = getCaseConverter('dotCase')(str);
        return dotCase.output;
    }

    /**
     * Convert a string from snake_case to sentenceCase.
     * @param str - The string to convert.
     * @returns The converted string in sentenceCase.
     */
    toSentenceCase(str: string) {
        const sentenceCase = getCaseConverter('sentenceCase')(str);
        return sentenceCase.output;
    }   

    /**
     * Convert a string from snake_case to pathCase.
     * @param str - The string to convert.
     * @returns The converted string in pathCase.
     */
    toPathCase(str: string) {
        const pathCase = getCaseConverter('pathCase')(str);
        return pathCase.output;
    }
}

// Export a singleton instance
export default new CaseMaker();



