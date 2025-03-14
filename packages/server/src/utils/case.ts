/**
 * CaseMaker is a utility class for converting strings between camelCase and snake_case.
 * It provides methods to check if a string is in camelCase or snake_case, and to convert between the two.
 * We use this to safely convert between the two cases for database column names.
 */



import { getCaseConverter } from 'uncase'
// @ts-ignore
import { isCamelCase, isSnakeCase, constantCase, dotCase, sentenceCase } from 'uncase/is'

export class CaseMaker {


    isCamelCase(str: string) {
        return isCamelCase(str)
    }

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

    toDotCase(str: string) {
        const dotCase = getCaseConverter('dotCase')(str)
        return dotCase.output
    }

    toSentenceCase(str: string) {
        const sentenceCase = getCaseConverter('sentenceCase')(str)
        return sentenceCase.output
    }   

}

export default new CaseMaker()
