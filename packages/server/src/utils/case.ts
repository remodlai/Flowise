/**
 * CaseMaker is a utility class for converting strings between camelCase and snake_case.
 * It provides methods to check if a string is in camelCase or snake_case, and to convert between the two.
 * We use this to safely convert between the two cases for database column names.
 */



import { getCaseConverter } from 'uncase'
// @ts-ignore
import { isCamelCase, isSnakeCase, constantCase, dotCase, sentenceCase } from 'uncase/is'

export class CaseMaker {

    /**
     * Check if a string is in camelCase.
     * @param str - The string to check.
     * @returns True if the string is in camelCase, false otherwise.
     */
    isCamelCase(str: string) {
        return isCamelCase(str)
    }

    /**
     * Check if a string is in snake_case.
     * @param str - The string to check.
     * @returns True if the string is in snake_case, false otherwise.
     */
    isSnakeCase(str: string) {
        return isSnakeCase(str)
    }

    /**
     * Convert a string from snake_case to camelCase.
     * @param str - The string to convert.
     * @returns The converted string in camelCase.
     */
    toCamelCase(str: string) {
        const camelCase = getCaseConverter('camelCase')(str)
        return camelCase.output
    }

    /**
     * Convert a string from camelCase to snake_case.
     * @param str - The string to convert.
     * @returns The converted string in snake_case.
     */
    toSnakeCase(str: string) {
        const snakeCase = getCaseConverter('snake_case')(str)
        return snakeCase.output
    }

    toConstantCase(str: string) {
        const constantCase = getCaseConverter('constantCase')(str)
        return constantCase.output
    }

    /**
     * Convert a string from snake_case to dotCase.
     * @param str - The string to convert.
     * @returns The converted string in dotCase.
     */
    toDotCase(str: string) {
        const dotCase = getCaseConverter('dotCase')(str)
        return dotCase.output
    }

    /**
     * Convert a string from snake_case to sentenceCase.
     * @param str - The string to convert.
     * @returns The converted string in sentenceCase.
     */
    toSentenceCase(str: string) {
        const sentenceCase = getCaseConverter('sentenceCase')(str)
        return sentenceCase.output
    }   

    /**
     * Convert a string from snake_case to pathCase.
     * @param str - The string to convert.
     * @returns The converted string in pathCase.
     */
    toPathCase(str: string) {
        const pathCase = getCaseConverter('pathCase')(str)
        return pathCase.output
    }

}

export default new CaseMaker()
