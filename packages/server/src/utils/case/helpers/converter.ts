import * as changeCase from './index';

/**
 * All case converter names
 */
export type CaseType =
  | 'camelCase'
  | 'capitalCase'
  | 'constantCase'
  | 'dotCase'
  | 'kebabCase'
  | 'noCase'
  | 'pascalCase'
  | 'pascalSnakeCase'
  | 'pathCase'
  | 'sentenceCase'
  | 'snakeCase'
  | 'trainCase';

/**
 * Case convert result
 */
export type CaseConvertResult = {
  /**
   * whether output has changed from input
   */
  changed: boolean;

  /**
   * input value
   */
  input: string;

  /**
   * converted value
   */
  output: string;
};

/**
 * Case converter
 */
export type CaseConverter = (input: string) => CaseConvertResult;

/**
 * Get a converter by caseType and convert the given input.
 */
export function getCaseConverter(caseType: CaseType, options: changeCase.Options = {}): CaseConverter {
  const converters: Record<CaseType, (input: string, options?: changeCase.Options) => string> = {
    camelCase: changeCase.camelCase,
    capitalCase: changeCase.capitalCase,
    constantCase: changeCase.constantCase,
    dotCase: changeCase.dotCase,
    kebabCase: changeCase.kebabCase,
    noCase: changeCase.noCase,
    pascalCase: changeCase.pascalCase,
    pascalSnakeCase: changeCase.pascalSnakeCase,
    pathCase: changeCase.pathCase,
    sentenceCase: changeCase.sentenceCase,
    snakeCase: changeCase.snakeCase,
    trainCase: changeCase.trainCase
  };

  const converter = converters[caseType];
  
  if (!converter) {
    throw new Error(`Unsupported case type: ${caseType}`);
  }

  return (input: string): CaseConvertResult => {
    const output = converter(input, options);
    return {
      changed: input !== output,
      input,
      output
    };
  };
} 