import { DataSource } from 'typeorm';
import { ICommonObject, IDatabaseEntity, IMessage, INodeData, IVariable, INodeParams } from './Interface';
import { BaseMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import { TextSplitter } from 'langchain/text_splitter';
import { DocumentLoader } from 'langchain/document_loaders/base';
export declare const numberOrExpressionRegex = "^(\\d+\\.?\\d*|{{.*}})$";
export declare const notEmptyRegex = "(.|\\s)*\\S(.|\\s)*";
export declare const FLOWISE_CHATID = "flowise_chatId";
export declare const availableDependencies: string[];
export declare const defaultAllowBuiltInDep: string[];
/**
 * Get base classes of components
 *
 * @export
 * @param {any} targetClass
 * @returns {string[]}
 */
export declare const getBaseClasses: (targetClass: any) => string[];
/**
 * Serialize axios query params
 *
 * @export
 * @param {any} params
 * @param {boolean} skipIndex // Set to true if you want same params to be: param=1&param=2 instead of: param[0]=1&param[1]=2
 * @returns {string}
 */
export declare function serializeQueryParams(params: any, skipIndex?: boolean): string;
/**
 * Handle error from try catch
 *
 * @export
 * @param {any} error
 * @returns {string}
 */
export declare function handleErrorMessage(error: any): string;
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
export declare const getNodeModulesPackagePath: (packageName: string) => string;
/**
 * Get input variables
 * @param {string} paramValue
 * @returns {boolean}
 */
export declare const getInputVariables: (paramValue: string) => string[];
/**
 * Transform curly braces into double curly braces if the content includes a colon.
 * @param input - The original string that may contain { ... } segments.
 * @returns The transformed string, where { ... } containing a colon has been replaced with {{ ... }}.
 */
export declare const transformBracesWithColon: (input: string) => string;
/**
 * Crawl all available urls given a domain url and limit
 * @param {string} url
 * @param {number} limit
 * @returns {string[]}
 */
export declare const getAvailableURLs: (url: string, limit: number) => Promise<string[]>;
/**
 * Prep URL before passing into recursive crawl function
 * @param {string} stringURL
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
export declare function webCrawl(stringURL: string, limit: number): Promise<string[]>;
export declare function getURLsFromXML(xmlBody: string, limit: number): string[];
export declare function xmlScrape(currentURL: string, limit: number): Promise<string[]>;
/**
 * Get env variables
 * @param {string} name
 * @returns {string | undefined}
 */
export declare const getEnvironmentVariable: (name: string) => string | undefined;
export declare const getEncryptionKeyPath: () => string;
export interface IComponentCredentials {
    [key: string]: {
        label: string;
        name: string;
        type: string;
        inputs: INodeParams[];
    };
}
export declare const redactCredentialWithPasswordType: (componentCredentialName: string, decryptedCredentialObj: ICommonObject, componentCredentials: IComponentCredentials) => ICommonObject;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @param {string} applicationId
 * @returns {Promise<ICommonObject>}
 */
export declare const decryptCredentialData: (encryptedData: string, componentCredentialName?: string, componentCredentials?: IComponentCredentials, applicationId?: string) => Promise<ICommonObject>;
/**
 * Get credential data
 * @param {string} selectedCredentialId
 * @param {ICommonObject} options
 * @returns {Promise<ICommonObject>}
 */
export declare const getCredentialData: (selectedCredentialId: string, options: ICommonObject) => Promise<ICommonObject>;
/**
 * Get first non falsy value
 *
 * @param {...any} values
 *
 * @returns {any|undefined}
 */
export declare const defaultChain: (...values: any[]) => any | undefined;
export declare const getCredentialParam: (paramName: string, credentialData: ICommonObject, nodeData: INodeData, defaultValue?: any) => any;
export declare function handleEscapeCharacters(input: any, reverse: Boolean): any;
/**
 * Get user home dir
 * @returns {string}
 */
export declare const getUserHome: () => string;
/**
 * Map ChatMessage to BaseMessage
 * @param {IChatMessage[]} chatmessages
 * @returns {BaseMessage[]}
 * This is where file uploads are parsed and converted to base64
 * TODO: we need to add integration with @SupabaseStorage here, based on @supabase/storage-js and our @supabaseStorage.ts implementation.
 */
export declare const mapChatMessageToBaseMessage: (chatmessages?: any[]) => Promise<BaseMessage[]>;
/**
 * Convert incoming chat history to string
 * @param {IMessage[]} chatHistory
 * @returns {string}
 */
export declare const convertChatHistoryToText: (chatHistory?: IMessage[]) => string;
/**
 * Serialize array chat history to string
 * @param {string | Array<string>} chatHistory
 * @returns {string}
 */
export declare const serializeChatHistory: (chatHistory: string | Array<string>) => string;
/**
 * Convert schema to zod schema
 * @param {string | object} schema
 * @returns {ICommonObject}
 */
export declare const convertSchemaToZod: (schema: string | object) => ICommonObject;
/**
 * Flatten nested object
 * @param {ICommonObject} obj
 * @param {string} parentKey
 * @returns {ICommonObject}
 */
export declare const flattenObject: (obj: ICommonObject, parentKey?: string) => any;
/**
 * Convert BaseMessage to IMessage
 * @param {BaseMessage[]} messages
 * @returns {IMessage[]}
 */
export declare const convertBaseMessagetoIMessage: (messages: BaseMessage[]) => IMessage[];
/**
 * Convert MultiOptions String to String Array
 * @param {string} inputString
 * @returns {string[]}
 */
export declare const convertMultiOptionsToStringArray: (inputString: string) => string[];
/**
 * Get variables
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {INodeData} nodeData
 */
export declare const getVars: (appDataSource: DataSource, databaseEntities: IDatabaseEntity, nodeData: INodeData) => Promise<IVariable[]>;
/**
 * Prepare sandbox variables
 * @param {IVariable[]} variables
 */
export declare const prepareSandboxVars: (variables: IVariable[]) => {};
export declare const getVersion: () => Promise<{
    version: string;
}>;
/**
 * Map Ext to InputField
 * @param {string} ext
 * @returns {string}
 */
export declare const mapExtToInputField: (ext: string) => "txtFile" | "pdfFile" | "jsonFile" | "csvFile" | "jsonlinesFile" | "docxFile" | "yamlFile";
/**
 * Map MimeType to InputField
 * @param {string} mimeType
 * @returns {string}
 */
export declare const mapMimeTypeToInputField: (mimeType: string) => "txtFile" | "pdfFile" | "jsonFile" | "csvFile" | "jsonlinesFile" | "docxFile" | "yamlFile";
/**
 * Map MimeType to Extension
 * @param {string} mimeType
 * @returns {string}
 */
export declare const mapMimeTypeToExt: (mimeType: string) => "json" | "jsonl" | "" | "txt" | "pdf" | "csv" | "doc" | "docx" | "xls" | "xlsx";
export declare const removeInvalidImageMarkdown: (output: string) => string;
/**
 * Extract output from array
 * @param {any} output
 * @returns {string}
 */
export declare const extractOutputFromArray: (output: any) => string;
/**
 * Loop through the object and replace the key with the value
 * @param {any} obj
 * @param {any} sourceObj
 * @returns {any}
 */
export declare const resolveFlowObjValue: (obj: any, sourceObj: any) => any;
export declare const handleDocumentLoaderOutput: (docs: Document[], output: string) => any;
export declare const parseDocumentLoaderMetadata: (metadata: object | string) => object;
export declare const handleDocumentLoaderMetadata: (docs: Document[], _omitMetadataKeys: string, metadata?: object | string, sourceIdKey?: string) => {
    metadata: object;
    pageContent: string;
    id?: string;
}[];
export declare const handleDocumentLoaderDocuments: (loader: DocumentLoader, textSplitter?: TextSplitter) => Promise<Document<Record<string, any>>[]>;
export declare const getApiBaseUrl: () => string;
