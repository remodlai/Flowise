"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiBaseUrl = exports.handleDocumentLoaderDocuments = exports.handleDocumentLoaderMetadata = exports.parseDocumentLoaderMetadata = exports.handleDocumentLoaderOutput = exports.resolveFlowObjValue = exports.extractOutputFromArray = exports.removeInvalidImageMarkdown = exports.mapMimeTypeToExt = exports.mapMimeTypeToInputField = exports.mapExtToInputField = exports.getVersion = exports.prepareSandboxVars = exports.getVars = exports.convertMultiOptionsToStringArray = exports.convertBaseMessagetoIMessage = exports.flattenObject = exports.convertSchemaToZod = exports.serializeChatHistory = exports.convertChatHistoryToText = exports.mapChatMessageToBaseMessage = exports.getUserHome = exports.getCredentialParam = exports.defaultChain = exports.getCredentialData = exports.decryptCredentialData = exports.redactCredentialWithPasswordType = exports.getEncryptionKeyPath = exports.getEnvironmentVariable = exports.getAvailableURLs = exports.transformBracesWithColon = exports.getInputVariables = exports.getNodeModulesPackagePath = exports.getBaseClasses = exports.defaultAllowBuiltInDep = exports.availableDependencies = exports.FLOWISE_CHATID = exports.notEmptyRegex = exports.numberOrExpressionRegex = void 0;
exports.serializeQueryParams = serializeQueryParams;
exports.handleErrorMessage = handleErrorMessage;
exports.webCrawl = webCrawl;
exports.getURLsFromXML = getURLsFromXML;
exports.xmlScrape = xmlScrape;
exports.handleEscapeCharacters = handleEscapeCharacters;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jsdom_1 = require("jsdom");
const zod_1 = require("zod");
const lodash_1 = require("lodash");
const messages_1 = require("@langchain/core/messages");
const storageUtils_1 = require("./storageUtils");
const commonUtils_1 = require("../nodes/sequentialagents/commonUtils");
const logger_1 = __importDefault(require("./logger"));
exports.numberOrExpressionRegex = '^(\\d+\\.?\\d*|{{.*}})$'; //return true if string consists only numbers OR expression {{}}
exports.notEmptyRegex = '(.|\\s)*\\S(.|\\s)*'; //return true if string is not empty or blank
exports.FLOWISE_CHATID = 'flowise_chatId';
/*
 * List of dependencies allowed to be import in @flowiseai/nodevm
 */
exports.availableDependencies = [
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-s3',
    '@elastic/elasticsearch',
    '@dqbd/tiktoken',
    '@getzep/zep-js',
    '@gomomento/sdk',
    '@gomomento/sdk-core',
    '@google-ai/generativelanguage',
    '@google/generative-ai',
    '@huggingface/inference',
    '@langchain/anthropic',
    '@langchain/aws',
    '@langchain/cohere',
    '@langchain/community',
    '@langchain/core',
    '@langchain/google-genai',
    '@langchain/google-vertexai',
    '@langchain/groq',
    '@langchain/langgraph',
    '@langchain/mistralai',
    '@langchain/mongodb',
    '@langchain/ollama',
    '@langchain/openai',
    '@langchain/pinecone',
    '@langchain/qdrant',
    '@langchain/weaviate',
    '@notionhq/client',
    '@opensearch-project/opensearch',
    '@pinecone-database/pinecone',
    '@qdrant/js-client-rest',
    '@supabase/supabase-js',
    '@upstash/redis',
    '@zilliz/milvus2-sdk-node',
    'apify-client',
    'axios',
    'cheerio',
    'chromadb',
    'cohere-ai',
    'd3-dsv',
    'faiss-node',
    'form-data',
    'google-auth-library',
    'graphql',
    'html-to-text',
    'ioredis',
    'langchain',
    'langfuse',
    'langsmith',
    'langwatch',
    'linkifyjs',
    'lunary',
    'mammoth',
    'moment',
    'mongodb',
    'mysql2',
    'node-fetch',
    'node-html-markdown',
    'notion-to-md',
    'openai',
    'pdf-parse',
    'pdfjs-dist',
    'pg',
    'playwright',
    'puppeteer',
    'redis',
    'replicate',
    'srt-parser-2',
    'typeorm',
    'weaviate-ts-client'
];
exports.defaultAllowBuiltInDep = [
    'assert',
    'buffer',
    'crypto',
    'events',
    'http',
    'https',
    'net',
    'path',
    'querystring',
    'timers',
    'tls',
    'url',
    'zlib'
];
/**
 * Get base classes of components
 *
 * @export
 * @param {any} targetClass
 * @returns {string[]}
 */
const getBaseClasses = (targetClass) => {
    const baseClasses = [];
    const skipClassNames = ['BaseLangChain', 'Serializable'];
    if (targetClass instanceof Function) {
        let baseClass = targetClass;
        while (baseClass) {
            const newBaseClass = Object.getPrototypeOf(baseClass);
            if (newBaseClass && newBaseClass !== Object && newBaseClass.name) {
                baseClass = newBaseClass;
                if (!skipClassNames.includes(baseClass.name))
                    baseClasses.push(baseClass.name);
            }
            else {
                break;
            }
        }
    }
    return baseClasses;
};
exports.getBaseClasses = getBaseClasses;
/**
 * Serialize axios query params
 *
 * @export
 * @param {any} params
 * @param {boolean} skipIndex // Set to true if you want same params to be: param=1&param=2 instead of: param[0]=1&param[1]=2
 * @returns {string}
 */
function serializeQueryParams(params, skipIndex) {
    const parts = [];
    const encode = (val) => {
        return encodeURIComponent(val)
            .replace(/%3A/gi, ':')
            .replace(/%24/g, '$')
            .replace(/%2C/gi, ',')
            .replace(/%20/g, '+')
            .replace(/%5B/gi, '[')
            .replace(/%5D/gi, ']');
    };
    const convertPart = (key, val) => {
        if (val instanceof Date)
            val = val.toISOString();
        else if (val instanceof Object)
            val = JSON.stringify(val);
        parts.push(encode(key) + '=' + encode(val));
    };
    Object.entries(params).forEach(([key, val]) => {
        if (val === null || typeof val === 'undefined')
            return;
        if (Array.isArray(val))
            val.forEach((v, i) => convertPart(`${key}${skipIndex ? '' : `[${i}]`}`, v));
        else
            convertPart(key, val);
    });
    return parts.join('&');
}
/**
 * Handle error from try catch
 *
 * @export
 * @param {any} error
 * @returns {string}
 */
function handleErrorMessage(error) {
    let errorMessage = '';
    if (error.message) {
        errorMessage += error.message + '. ';
    }
    if (error.response && error.response.data) {
        if (error.response.data.error) {
            if (typeof error.response.data.error === 'object')
                errorMessage += JSON.stringify(error.response.data.error) + '. ';
            else if (typeof error.response.data.error === 'string')
                errorMessage += error.response.data.error + '. ';
        }
        else if (error.response.data.msg)
            errorMessage += error.response.data.msg + '. ';
        else if (error.response.data.Message)
            errorMessage += error.response.data.Message + '. ';
        else if (typeof error.response.data === 'string')
            errorMessage += error.response.data + '. ';
    }
    if (!errorMessage)
        errorMessage = 'Unexpected Error.';
    return errorMessage;
}
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
const getNodeModulesPackagePath = (packageName) => {
    const checkPaths = [
        path.join(__dirname, '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', '..', '..', 'node_modules', packageName),
        path.join(__dirname, '..', '..', '..', '..', '..', 'node_modules', packageName)
    ];
    for (const checkPath of checkPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
exports.getNodeModulesPackagePath = getNodeModulesPackagePath;
/**
 * Get input variables
 * @param {string} paramValue
 * @returns {boolean}
 */
const getInputVariables = (paramValue) => {
    if (typeof paramValue !== 'string')
        return [];
    const returnVal = paramValue;
    const variableStack = [];
    const inputVariables = [];
    let startIdx = 0;
    const endIdx = returnVal.length;
    while (startIdx < endIdx) {
        const substr = returnVal.substring(startIdx, startIdx + 1);
        // Check for escaped curly brackets
        if (substr === '\\' && (returnVal[startIdx + 1] === '{' || returnVal[startIdx + 1] === '}')) {
            startIdx += 2; // Skip the escaped bracket
            continue;
        }
        // Store the opening double curly bracket
        if (substr === '{') {
            variableStack.push({ substr, startIdx: startIdx + 1 });
        }
        // Found the complete variable
        if (substr === '}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx;
            const variableEndIdx = startIdx;
            const variableFullPath = returnVal.substring(variableStartIdx, variableEndIdx);
            if (!variableFullPath.includes(':'))
                inputVariables.push(variableFullPath);
            variableStack.pop();
        }
        startIdx += 1;
    }
    return inputVariables;
};
exports.getInputVariables = getInputVariables;
/**
 * Transform curly braces into double curly braces if the content includes a colon.
 * @param input - The original string that may contain { ... } segments.
 * @returns The transformed string, where { ... } containing a colon has been replaced with {{ ... }}.
 */
const transformBracesWithColon = (input) => {
    // This regex will match anything of the form `{ ... }` (no nested braces).
    // `[^{}]*` means: match any characters that are not `{` or `}` zero or more times.
    const regex = /\{([^{}]*?)\}/g;
    return input.replace(regex, (match, groupContent) => {
        // groupContent is the text inside the braces `{ ... }`.
        if (groupContent.includes(':')) {
            // If there's a colon in the content, we turn { ... } into {{ ... }}
            // The match is the full string like: "{ answer: hello }"
            // groupContent is the inner part like: " answer: hello "
            return `{{${groupContent}}}`;
        }
        else {
            // Otherwise, leave it as is
            return match;
        }
    });
};
exports.transformBracesWithColon = transformBracesWithColon;
/**
 * Crawl all available urls given a domain url and limit
 * @param {string} url
 * @param {number} limit
 * @returns {string[]}
 */
const getAvailableURLs = async (url, limit) => {
    try {
        const availableUrls = [];
        console.info(`Crawling: ${url}`);
        availableUrls.push(url);
        const response = await axios_1.default.get(url);
        const $ = (0, cheerio_1.load)(response.data);
        const relativeLinks = $("a[href^='/']");
        console.info(`Available Relative Links: ${relativeLinks.length}`);
        if (relativeLinks.length === 0)
            return availableUrls;
        limit = Math.min(limit + 1, relativeLinks.length); // limit + 1 is because index start from 0 and index 0 is occupy by url
        console.info(`True Limit: ${limit}`);
        // availableUrls.length cannot exceed limit
        for (let i = 0; availableUrls.length < limit; i++) {
            if (i === limit)
                break; // some links are repetitive so it won't added into the array which cause the length to be lesser
            console.info(`index: ${i}`);
            const element = relativeLinks[i];
            const relativeUrl = $(element).attr('href');
            if (!relativeUrl)
                continue;
            const absoluteUrl = new URL(relativeUrl, url).toString();
            if (!availableUrls.includes(absoluteUrl)) {
                availableUrls.push(absoluteUrl);
                console.info(`Found unique relative link: ${absoluteUrl}`);
            }
        }
        return availableUrls;
    }
    catch (err) {
        throw new Error(`getAvailableURLs: ${err instanceof Error ? err.message : String(err)}`);
    }
};
exports.getAvailableURLs = getAvailableURLs;
/**
 * Search for href through htmlBody string
 * @param {string} htmlBody
 * @param {string} baseURL
 * @returns {string[]}
 */
function getURLsFromHTML(htmlBody, baseURL) {
    const dom = new jsdom_1.JSDOM(htmlBody);
    const linkElements = dom.window.document.querySelectorAll('a');
    const urls = [];
    for (const linkElement of linkElements) {
        try {
            const urlObj = new URL(linkElement.href, baseURL);
            urls.push(urlObj.href);
        }
        catch (err) {
            if (process.env.DEBUG === 'true')
                console.error(`error with scraped URL: ${err instanceof Error ? err.message : String(err)}`);
            continue;
        }
    }
    return urls;
}
/**
 * Normalize URL to prevent crawling the same page
 * @param {string} urlString
 * @returns {string}
 */
function normalizeURL(urlString) {
    const urlObj = new URL(urlString);
    const hostPath = urlObj.hostname + urlObj.pathname + urlObj.search;
    if (hostPath.length > 0 && hostPath.slice(-1) == '/') {
        // handling trailing slash
        return hostPath.slice(0, -1);
    }
    return hostPath;
}
/**
 * Recursive crawl using normalizeURL and getURLsFromHTML
 * @param {string} baseURL
 * @param {string} currentURL
 * @param {string[]} pages
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
async function crawl(baseURL, currentURL, pages, limit) {
    const baseURLObj = new URL(baseURL);
    const currentURLObj = new URL(currentURL);
    if (limit !== 0 && pages.length === limit)
        return pages;
    if (baseURLObj.hostname !== currentURLObj.hostname)
        return pages;
    const normalizeCurrentURL = baseURLObj.protocol + '//' + normalizeURL(currentURL);
    if (pages.includes(normalizeCurrentURL)) {
        return pages;
    }
    pages.push(normalizeCurrentURL);
    if (process.env.DEBUG === 'true')
        console.info(`actively crawling ${currentURL}`);
    try {
        const resp = await fetch(currentURL);
        if (resp.status > 399) {
            if (process.env.DEBUG === 'true')
                console.error(`error in fetch with status code: ${resp.status}, on page: ${currentURL}`);
            return pages;
        }
        const contentType = resp.headers.get('content-type');
        if ((contentType && !contentType.includes('text/html')) || !contentType) {
            if (process.env.DEBUG === 'true')
                console.error(`non html response, content type: ${contentType}, on page: ${currentURL}`);
            return pages;
        }
        const htmlBody = await resp.text();
        const nextURLs = getURLsFromHTML(htmlBody, currentURL);
        for (const nextURL of nextURLs) {
            pages = await crawl(baseURL, nextURL, pages, limit);
        }
    }
    catch (err) {
        if (process.env.DEBUG === 'true')
            console.error(`error in fetch url: ${err instanceof Error ? err.message : String(err)}, on page: ${currentURL}`);
    }
    return pages;
}
/**
 * Prep URL before passing into recursive crawl function
 * @param {string} stringURL
 * @param {number} limit
 * @returns {Promise<string[]>}
 */
async function webCrawl(stringURL, limit) {
    const URLObj = new URL(stringURL);
    const modifyURL = stringURL.slice(-1) === '/' ? stringURL.slice(0, -1) : stringURL;
    return await crawl(URLObj.protocol + '//' + URLObj.hostname, modifyURL, [], limit);
}
function getURLsFromXML(xmlBody, limit) {
    const dom = new jsdom_1.JSDOM(xmlBody, { contentType: 'text/xml' });
    const linkElements = dom.window.document.querySelectorAll('url');
    const urls = [];
    for (const linkElement of linkElements) {
        const locElement = linkElement.querySelector('loc');
        if (limit !== 0 && urls.length === limit)
            break;
        if (locElement?.textContent) {
            urls.push(locElement.textContent);
        }
    }
    return urls;
}
async function xmlScrape(currentURL, limit) {
    let urls = [];
    if (process.env.DEBUG === 'true')
        console.info(`actively scarping ${currentURL}`);
    try {
        const resp = await fetch(currentURL);
        if (resp.status > 399) {
            if (process.env.DEBUG === 'true')
                console.error(`error in fetch with status code: ${resp.status}, on page: ${currentURL}`);
            return urls;
        }
        const contentType = resp.headers.get('content-type');
        if ((contentType && !contentType.includes('application/xml') && !contentType.includes('text/xml')) || !contentType) {
            if (process.env.DEBUG === 'true')
                console.error(`non xml response, content type: ${contentType}, on page: ${currentURL}`);
            return urls;
        }
        const xmlBody = await resp.text();
        urls = getURLsFromXML(xmlBody, limit);
    }
    catch (err) {
        if (process.env.DEBUG === 'true')
            console.error(`error in fetch url: ${err instanceof Error ? err.message : String(err)}, on page: ${currentURL}`);
    }
    return urls;
}
/**
 * Get env variables
 * @param {string} name
 * @returns {string | undefined}
 */
const getEnvironmentVariable = (name) => {
    try {
        return typeof process !== 'undefined' ? process.env?.[name] : undefined;
    }
    catch (e) {
        return undefined;
    }
};
exports.getEnvironmentVariable = getEnvironmentVariable;
/**
 * Returns the path of encryption key
 * @returns {string}
 */
const getEncryptionKeyFilePath = () => {
    const checkPaths = [
        path.join(__dirname, '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', 'server', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', 'server', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', 'server', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', '..', 'encryption.key'),
        path.join(__dirname, '..', '..', '..', '..', '..', 'server', 'encryption.key'),
        path.join((0, exports.getUserHome)(), '.flowise', 'encryption.key')
    ];
    for (const checkPath of checkPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
const getEncryptionKeyPath = () => {
    return process.env.SECRETKEY_PATH ? path.join(process.env.SECRETKEY_PATH, 'encryption.key') : getEncryptionKeyFilePath();
};
exports.getEncryptionKeyPath = getEncryptionKeyPath;
/**
 * Returns the encryption key
 * @returns {Promise<string>}
 */
const getEncryptionKey = async () => {
    try {
        // Import the platform settings utility
        logger_1.default.debug('========= Start of getEncryptionKey from Components=========');
        const { getEncryptionKey: getPlatformEncryptionKey } = await Promise.resolve().then(() => __importStar(require('./platformSettings')));
        // Get the encryption key from platform settings
        const encryptionKey = await getPlatformEncryptionKey();
        logger_1.default.debug(`[components]: Encryption key: ${encryptionKey}`);
        logger_1.default.debug('========= End of getEncryptionKey =========');
        return encryptionKey;
    }
    catch (error) {
        // Log the error and rethrow
        console.error('Error retrieving encryption key:', error);
        throw new Error('Failed to retrieve encryption key from platform settings. Please ensure the ENCRYPTION_KEY is set in platform settings.');
    }
};
// Add the redactCredentialWithPasswordType function
const redactCredentialWithPasswordType = (componentCredentialName, decryptedCredentialObj, componentCredentials) => {
    console.log('Redacting credential with password type');
    const plainDataObj = { ...decryptedCredentialObj };
    // Check if the component credential exists
    if (!componentCredentials[componentCredentialName]) {
        console.log('Component credential not found:', componentCredentialName);
        return plainDataObj;
    }
    // Get the inputs for the component credential
    const inputs = componentCredentials[componentCredentialName].inputs || [];
    // Redact any password fields
    for (const cred in plainDataObj) {
        const inputParam = inputs.find((inp) => inp.type === 'password' && inp.name === cred);
        if (inputParam) {
            console.log('Redacting password field:', cred);
            plainDataObj[cred] = '********';
        }
    }
    return plainDataObj;
};
exports.redactCredentialWithPasswordType = redactCredentialWithPasswordType;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @param {string} applicationId
 * @returns {Promise<ICommonObject>}
 */
const decryptCredentialData = async (encryptedData, componentCredentialName, componentCredentials, applicationId) => {
    logger_1.default.debug('========= Start of decryptCredentialData (components) =========');
    logger_1.default.debug(`encryptedData: ${encryptedData}`);
    logger_1.default.debug(`componentCredentialName: ${componentCredentialName || 'none'}`);
    logger_1.default.debug(`componentCredentials: ${componentCredentials ? 'provided' : 'none'}`);
    logger_1.default.debug(`applicationId from parameter: ${applicationId || 'none'}`);
    logger_1.default.debug(`REMODL_API_BASE_URL environment variable: ${process.env.REMODL_API_BASE_URL ?? 'not set'}`);
    logger_1.default.debug(`API base URL from getApiBaseUrl(): ${(0, exports.getApiBaseUrl)()}`);
    try {
        if (!encryptedData) {
            logger_1.default.debug('No encrypted data provided, returning empty object');
            return {};
        }
        // For our Supabase implementation, the encryptedData is actually the secret ID
        // So we make a direct API call to get the secret
        // Use the configurable base URL
        const baseUrl = (0, exports.getApiBaseUrl)();
        let url = `${baseUrl}/api/v1/secrets/${encryptedData}`;
        let decryptedDataStr;
        try {
            // Use application ID from parameter if available
            if (applicationId) {
                logger_1.default.debug(`Using applicationId from parameter: ${applicationId}`);
                url = `${url}?applicationId=${applicationId}`;
                logger_1.default.debug(`Final URL with applicationId: ${url}`);
            }
            else {
                // Fallback to localStorage if in browser environment
                try {
                    // Check if we're in a browser environment
                    if (typeof localStorage !== 'undefined') {
                        const localStorageAppId = localStorage.getItem('selectedApplicationId') || '';
                        if (localStorageAppId) {
                            logger_1.default.debug(`Using applicationId from localStorage: ${localStorageAppId}`);
                            url = `${url}?applicationId=${localStorageAppId}`;
                            logger_1.default.debug(`Final URL with localStorage applicationId: ${url}`);
                        }
                        else {
                            logger_1.default.debug('No applicationId found in localStorage');
                        }
                    }
                    else {
                        logger_1.default.debug('Not in browser environment, localStorage is undefined');
                    }
                }
                catch (e) {
                    logger_1.default.debug(`Error getting application ID from localStorage: ${e}`);
                    logger_1.default.debug(`Error message: ${e instanceof Error ? e.message : String(e)}`);
                    logger_1.default.debug(`Stack trace: ${e instanceof Error ? e.stack : 'No stack trace available'}`);
                    // Continue without application ID if there's an error
                }
            }
            logger_1.default.debug(`Making API call to ${url}`);
            // Call the API to get the secret from Supabase
            try {
                logger_1.default.debug(`Starting axios.get request to ${url}`);
                logger_1.default.debug(`Axios version: ${axios_1.default.VERSION || 'unknown'}`);
                logger_1.default.debug(`Node.js version: ${process.version}`);
                // Add timeout and additional logging
                const axiosConfig = {
                    timeout: 10000, // 10 seconds timeout
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                };
                logger_1.default.debug(`Axios config: ${JSON.stringify(axiosConfig, null, 2)}`);
                const response = await axios_1.default.get(url, axiosConfig);
                logger_1.default.debug(`API response status: ${response.status}`);
                logger_1.default.debug(`API response headers: ${JSON.stringify(response.headers, null, 2)}`);
                logger_1.default.debug(`API response data structure: ${JSON.stringify(Object.keys(response.data || {}), null, 2)}`);
                if (response.data && response.data.data) {
                    logger_1.default.debug('Got data from API response');
                    logger_1.default.debug(`Response data.data exists: ${!!response.data.data}`);
                    logger_1.default.debug(`Response data.data type: ${typeof response.data.data}`);
                    logger_1.default.debug(`Response data.data keys: ${Object.keys(response.data.data).join(', ')}`);
                    // Convert the data object to a string
                    decryptedDataStr = JSON.stringify(response.data.data);
                    logger_1.default.debug(`Decrypted data string length: ${decryptedDataStr.length}`);
                    logger_1.default.debug(`First 50 chars of decrypted data string: ${decryptedDataStr.substring(0, 50)}...`);
                }
                else {
                    logger_1.default.debug(`No data in API response: ${JSON.stringify(response.data, null, 2)}`);
                    throw new Error('Failed to retrieve secret value.');
                }
            }
            catch (error) {
                logger_1.default.error(`Error making API call to ${url}: ${error}`);
                logger_1.default.debug(`Error type: ${error.constructor?.name || 'Unknown'}`);
                logger_1.default.debug(`Error message: ${error instanceof Error ? error.message : String(error)}`);
                if (error.response) {
                    logger_1.default.error(`Response status: ${error.response.status}`);
                    logger_1.default.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
                    logger_1.default.error(`Response headers: ${JSON.stringify(error.response.headers, null, 2)}`);
                }
                else if (error.request) {
                    logger_1.default.error(`No response received. Request: ${JSON.stringify(error.request, null, 2)}`);
                }
                else {
                    logger_1.default.error(`Error setting up request: ${error instanceof Error ? error.message : String(error)}`);
                }
                logger_1.default.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error(`Error retrieving secret: ${error}`);
            logger_1.default.debug(`Error type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
            logger_1.default.debug(`Error message: ${error instanceof Error ? error.message : String(error)}`);
            logger_1.default.debug(`Full error: ${JSON.stringify(error, null, 2)}`);
            // Type guard for error.response
            const errorWithResponse = error;
            logger_1.default.debug(`Error response: ${errorWithResponse.response ? JSON.stringify(errorWithResponse.response.data, null, 2) : 'no response'}`);
            logger_1.default.debug(`Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
            throw new Error('Credentials could not be decrypted.');
        }
        if (!decryptedDataStr) {
            logger_1.default.debug('Decrypted data string is empty');
            return {};
        }
        try {
            logger_1.default.debug('Parsing decrypted data string to JSON');
            const plainDataObj = JSON.parse(decryptedDataStr);
            logger_1.default.debug(`Parsed data keys: ${Object.keys(plainDataObj).join(', ')}`);
            logger_1.default.debug(`Parsed data: ${JSON.stringify(plainDataObj, null, 2)}`);
            // If componentCredentialName and componentCredentials are provided, redact sensitive information
            if (componentCredentialName && componentCredentials) {
                logger_1.default.debug(`Redacting sensitive information for ${componentCredentialName}`);
                const redactedData = (0, exports.redactCredentialWithPasswordType)(componentCredentialName, plainDataObj, componentCredentials);
                logger_1.default.debug(`Redacted data keys: ${Object.keys(redactedData).join(', ')}`);
                logger_1.default.debug(`Redacted data: ${JSON.stringify(redactedData, null, 2)}`);
                logger_1.default.debug('========= End of decryptCredentialData (components) =========');
                return redactedData;
            }
            logger_1.default.debug('No redaction needed, returning plain data');
            logger_1.default.debug('========= End of decryptCredentialData (components) =========');
            return plainDataObj;
        }
        catch (e) {
            logger_1.default.error(`Error parsing decrypted data: ${e}`);
            logger_1.default.debug(`Error type: ${e instanceof Error ? e.constructor.name : 'Unknown'}`);
            logger_1.default.debug(`Error message: ${e instanceof Error ? e.message : String(e)}`);
            logger_1.default.debug(`Full error: ${JSON.stringify(e, null, 2)}`);
            logger_1.default.debug(`Stack trace: ${e instanceof Error ? e.stack : 'No stack trace available'}`);
            throw new Error(e instanceof Error ? e.message : String(e));
        }
    }
    catch (error) {
        logger_1.default.error(`Error in decryptCredentialData: ${error}`);
        logger_1.default.debug(`Error type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
        logger_1.default.debug(`Error message: ${error instanceof Error ? error.message : String(error)}`);
        logger_1.default.debug(`Full error: ${JSON.stringify(error, null, 2)}`);
        logger_1.default.debug('========= End of decryptCredentialData (components) with error =========');
        return {};
    }
};
exports.decryptCredentialData = decryptCredentialData;
/**
 * Get credential data
 * @param {string} selectedCredentialId
 * @param {ICommonObject} options
 * @returns {Promise<ICommonObject>}
 */
const getCredentialData = async (selectedCredentialId, options) => {
    logger_1.default.debug('========= Start of getCredentialData =========');
    logger_1.default.debug(`selectedCredentialId: ${selectedCredentialId}`);
    logger_1.default.debug(`options keys: ${Object.keys(options).join(', ')}`);
    logger_1.default.debug(`REMODL_API_BASE_URL environment variable: ${process.env.REMODL_API_BASE_URL ?? 'not set'}`);
    logger_1.default.debug(`API base URL from getApiBaseUrl(): ${(0, exports.getApiBaseUrl)()}`);
    try {
        if (!selectedCredentialId) {
            logger_1.default.debug('No credential ID provided, returning empty object');
            return {};
        }
        // Extract application ID from options if available
        logger_1.default.debug(`Checking for appId in options directly: ${options?.appId || 'not present'}`);
        logger_1.default.debug(`Checking if flowConfig exists: ${options?.flowConfig ? 'yes' : 'no'}`);
        if (options?.flowConfig) {
            logger_1.default.debug(`flowConfig keys: ${Object.keys(options.flowConfig).join(', ')}`);
            logger_1.default.debug(`Checking for appId in flowConfig: ${options?.flowConfig?.appId || 'not present'}`);
        }
        const applicationId = options?.appId || options?.flowConfig?.appId || '';
        logger_1.default.debug(`Final application ID extracted: ${applicationId || 'none'}`);
        if (!applicationId) {
            logger_1.default.debug('WARNING: No application ID found in options. This may cause credential retrieval to fail.');
            logger_1.default.debug(`Full options object: ${JSON.stringify(options, null, 2)}`);
        }
        // In our Supabase implementation, the selectedCredentialId is the secret ID
        // So we can directly decrypt it without needing to query the database
        try {
            logger_1.default.debug(`Calling decryptCredentialData with ID: ${selectedCredentialId} and applicationId: ${applicationId}`);
            // But we do pass the application ID
            const decryptedCredentialData = await (0, exports.decryptCredentialData)(selectedCredentialId, undefined, undefined, applicationId);
            logger_1.default.debug(`Decrypted credential data received: ${decryptedCredentialData ? 'yes' : 'no'}`);
            logger_1.default.debug(`Decrypted credential data keys: ${decryptedCredentialData ? Object.keys(decryptedCredentialData).join(', ') : 'none'}`);
            logger_1.default.debug(`Decrypted credential data: ${JSON.stringify(decryptedCredentialData, null, 2)}`);
            return decryptedCredentialData;
        }
        catch (error) {
            logger_1.default.error(`Error decrypting credential data: ${error}`);
            logger_1.default.debug(`Full error: ${JSON.stringify(error, null, 2)}`);
            logger_1.default.debug(`Error message: ${error instanceof Error ? error.message : String(error)}`);
            logger_1.default.debug(`Stack trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
            return {};
        }
    }
    catch (e) {
        logger_1.default.error(`Error in getCredentialData: ${e}`);
        logger_1.default.debug(`Full error: ${JSON.stringify(e, null, 2)}`);
        logger_1.default.debug(`Error message: ${e instanceof Error ? e.message : String(e)}`);
        logger_1.default.debug(`Stack trace: ${e instanceof Error ? e.stack : 'No stack trace available'}`);
        // Return empty object instead of throwing to avoid breaking flows
        return {};
    }
    finally {
        logger_1.default.debug('========= End of getCredentialData =========');
    }
};
exports.getCredentialData = getCredentialData;
/**
 * Get first non falsy value
 *
 * @param {...any} values
 *
 * @returns {any|undefined}
 */
const defaultChain = (...values) => {
    return values.filter(Boolean)[0];
};
exports.defaultChain = defaultChain;
const getCredentialParam = (paramName, credentialData, nodeData, defaultValue) => {
    logger_1.default.debug('========= Start of getCredentialParam =========');
    logger_1.default.debug(`paramName: ${paramName}`);
    logger_1.default.debug(`credentialData keys: ${Object.keys(credentialData).join(', ')}`);
    logger_1.default.debug(`credentialData content: ${JSON.stringify(credentialData, null, 2)}`);
    logger_1.default.debug(`nodeData.id: ${nodeData.id}`);
    logger_1.default.debug(`nodeData.credential: ${nodeData.credential}`);
    logger_1.default.debug(`nodeData.inputs keys: ${Object.keys(nodeData.inputs || {}).join(', ')}`);
    logger_1.default.debug(`defaultValue: ${defaultValue}`);
    const fromInputs = nodeData.inputs[paramName];
    const fromCredential = credentialData[paramName];
    logger_1.default.debug(`Value from inputs: ${fromInputs ? (typeof fromInputs === 'object' ? JSON.stringify(fromInputs) : fromInputs) : 'undefined'}`);
    logger_1.default.debug(`Value from credential: ${fromCredential ? (typeof fromCredential === 'object' ? JSON.stringify(fromCredential) : fromCredential) : 'undefined'}`);
    const finalValue = fromInputs ?? fromCredential ?? defaultValue ?? undefined;
    logger_1.default.debug(`Using final value: ${finalValue ? (typeof finalValue === 'object' ? JSON.stringify(finalValue) : finalValue) : 'undefined'}`);
    logger_1.default.debug(`Final value type: ${typeof finalValue}`);
    logger_1.default.debug(`Final value exists: ${finalValue !== undefined}`);
    logger_1.default.debug(`Final value is empty string: ${finalValue === ''}`);
    logger_1.default.debug(`Final value is null: ${finalValue === null}`);
    logger_1.default.debug('========= End of getCredentialParam =========');
    return finalValue;
};
exports.getCredentialParam = getCredentialParam;
// reference https://www.freeformatter.com/json-escape.html
const jsonEscapeCharacters = [
    { escape: '"', value: 'FLOWISE_DOUBLE_QUOTE' },
    { escape: '\n', value: 'FLOWISE_NEWLINE' },
    { escape: '\b', value: 'FLOWISE_BACKSPACE' },
    { escape: '\f', value: 'FLOWISE_FORM_FEED' },
    { escape: '\r', value: 'FLOWISE_CARRIAGE_RETURN' },
    { escape: '\t', value: 'FLOWISE_TAB' },
    { escape: '\\', value: 'FLOWISE_BACKSLASH' }
];
function handleEscapesJSONParse(input, reverse) {
    for (const element of jsonEscapeCharacters) {
        input = reverse ? input.replaceAll(element.value, element.escape) : input.replaceAll(element.escape, element.value);
    }
    return input;
}
function iterateEscapesJSONParse(input, reverse) {
    for (const element in input) {
        const type = typeof input[element];
        if (type === 'string')
            input[element] = handleEscapesJSONParse(input[element], reverse);
        else if (type === 'object')
            input[element] = iterateEscapesJSONParse(input[element], reverse);
    }
    return input;
}
function handleEscapeCharacters(input, reverse) {
    const type = typeof input;
    if (type === 'string')
        return handleEscapesJSONParse(input, reverse);
    else if (type === 'object')
        return iterateEscapesJSONParse(input, reverse);
    return input;
}
/**
 * Get user home dir
 * @returns {string}
 */
const getUserHome = () => {
    let variableName = 'HOME';
    if (process.platform === 'win32') {
        variableName = 'USERPROFILE';
    }
    if (process.env[variableName] === undefined) {
        // If for some reason the variable does not exist, fall back to current folder
        return process.cwd();
    }
    return process.env[variableName];
};
exports.getUserHome = getUserHome;
/**
 * Map ChatMessage to BaseMessage
 * @param {IChatMessage[]} chatmessages
 * @returns {BaseMessage[]}
 * This is where file uploads are parsed and converted to base64
 * TODO: we need to add integration with @SupabaseStorage here, based on @supabase/storage-js and our @supabaseStorage.ts implementation.
 */
const mapChatMessageToBaseMessage = async (chatmessages = []) => {
    const chatHistory = [];
    for (const message of chatmessages) {
        if (message.role === 'apiMessage' || message.type === 'apiMessage') {
            chatHistory.push(new messages_1.AIMessage(message.content || ''));
        }
        else if (message.role === 'userMessage' || message.role === 'userMessage') {
            // check for image/files uploads
            if (message.fileUploads) {
                // example: [{"type":"stored-file","name":"0_DiXc4ZklSTo3M8J4.jpg","mime":"image/jpeg"}]
                try {
                    let messageWithFileUploads = '';
                    const uploads = JSON.parse(message.fileUploads);
                    const imageContents = [];
                    for (const upload of uploads) {
                        if (upload.type === 'stored-file' && upload.mime.startsWith('image')) {
                            const fileData = await (0, storageUtils_1.getFileFromStorage)(upload.name, message.chatflowid, message.chatId);
                            // as the image is stored in the server, read the file and convert it to base64
                            //REMODL TODO - we need to resize the image to a MAX long size 1000px, and max dpi of 72
                            //REMODL TODO - we need to add the image to the supabase storage bucket for the given organization>user
                            //REMODL TODO - we need to return the url of the image from supabase storage
                            //REMODL TODO - we need to store the url of the image in the chat message history (this should be already handled automatically by the @mapChatMessageToBaseMessage function)
                            const bf = 'data:' + upload.mime + ';base64,' + fileData.toString('base64');
                            imageContents.push({
                                type: 'image_url',
                                image_url: {
                                    url: bf //REMODL TODO - we need to return the url of the image from supabase storage
                                }
                            });
                        }
                        else if (upload.type === 'url' && upload.mime.startsWith('image')) {
                            imageContents.push({
                                type: 'image_url',
                                image_url: {
                                    url: upload.data
                                }
                            });
                        }
                        else if (upload.type === 'stored-file:full') {
                            const fileLoaderNodeModule = await Promise.resolve().then(() => __importStar(require('../nodes/documentloaders/File/File')));
                            // @ts-ignore
                            const fileLoaderNodeInstance = new fileLoaderNodeModule.nodeClass();
                            const options = {
                                retrieveAttachmentChatId: true,
                                chatflowid: message.chatflowid,
                                chatId: message.chatId
                            };
                            const nodeData = {
                                inputs: {
                                    txtFile: `FILE-STORAGE::${JSON.stringify([upload.name])}`
                                }
                            };
                            const documents = await fileLoaderNodeInstance.init(nodeData, '', options);
                            const pageContents = documents.map((doc) => doc.pageContent).join('\n');
                            messageWithFileUploads += `<doc name='${upload.name}'>${pageContents}</doc>\n\n`;
                        }
                    }
                    const messageContent = messageWithFileUploads ? `${messageWithFileUploads}\n\n${message.content}` : message.content;
                    chatHistory.push(new messages_1.HumanMessage({
                        content: [
                            {
                                type: 'text',
                                text: messageContent
                            },
                            ...imageContents
                        ]
                    }));
                }
                catch (e) {
                    // failed to parse fileUploads, continue with text only
                    chatHistory.push(new messages_1.HumanMessage(message.content || ''));
                }
            }
            else {
                chatHistory.push(new messages_1.HumanMessage(message.content || ''));
            }
        }
    }
    return chatHistory;
};
exports.mapChatMessageToBaseMessage = mapChatMessageToBaseMessage;
/**
 * Convert incoming chat history to string
 * @param {IMessage[]} chatHistory
 * @returns {string}
 */
const convertChatHistoryToText = (chatHistory = []) => {
    return chatHistory
        .map((chatMessage) => {
        if (chatMessage.type === 'apiMessage') {
            return `Assistant: ${chatMessage.message}`;
        }
        else if (chatMessage.type === 'userMessage') {
            return `Human: ${chatMessage.message}`;
        }
        else {
            return `${chatMessage.message}`;
        }
    })
        .join('\n');
};
exports.convertChatHistoryToText = convertChatHistoryToText;
/**
 * Serialize array chat history to string
 * @param {string | Array<string>} chatHistory
 * @returns {string}
 */
const serializeChatHistory = (chatHistory) => {
    if (Array.isArray(chatHistory)) {
        return chatHistory.join('\n');
    }
    return chatHistory;
};
exports.serializeChatHistory = serializeChatHistory;
/**
 * Convert schema to zod schema
 * @param {string | object} schema
 * @returns {ICommonObject}
 */
const convertSchemaToZod = (schema) => {
    try {
        const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
        const zodObj = {};
        for (const sch of parsedSchema) {
            if (sch.type === 'string') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.string({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.string().describe(sch.description).optional();
                }
            }
            else if (sch.type === 'number') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.number({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.number().describe(sch.description).optional();
                }
            }
            else if (sch.type === 'boolean') {
                if (sch.required) {
                    zodObj[sch.property] = zod_1.z.boolean({ required_error: `${sch.property} required` }).describe(sch.description);
                }
                else {
                    zodObj[sch.property] = zod_1.z.boolean().describe(sch.description).optional();
                }
            }
        }
        return zodObj;
    }
    catch (e) {
        throw new Error(e instanceof Error ? e.message : String(e));
    }
};
exports.convertSchemaToZod = convertSchemaToZod;
/**
 * Flatten nested object
 * @param {ICommonObject} obj
 * @param {string} parentKey
 * @returns {ICommonObject}
 */
const flattenObject = (obj, parentKey) => {
    let result = {};
    if (!obj)
        return result;
    Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const _key = parentKey ? parentKey + '.' + key : key;
        if (typeof value === 'object') {
            result = { ...result, ...(0, exports.flattenObject)(value, _key) };
        }
        else {
            result[_key] = value;
        }
    });
    return result;
};
exports.flattenObject = flattenObject;
/**
 * Convert BaseMessage to IMessage
 * @param {BaseMessage[]} messages
 * @returns {IMessage[]}
 */
const convertBaseMessagetoIMessage = (messages) => {
    const formatmessages = [];
    for (const m of messages) {
        if (m._getType() === 'human') {
            formatmessages.push({
                message: m.content,
                type: 'userMessage'
            });
        }
        else if (m._getType() === 'ai') {
            formatmessages.push({
                message: m.content,
                type: 'apiMessage'
            });
        }
        else if (m._getType() === 'system') {
            formatmessages.push({
                message: m.content,
                type: 'apiMessage'
            });
        }
    }
    return formatmessages;
};
exports.convertBaseMessagetoIMessage = convertBaseMessagetoIMessage;
/**
 * Convert MultiOptions String to String Array
 * @param {string} inputString
 * @returns {string[]}
 */
const convertMultiOptionsToStringArray = (inputString) => {
    let ArrayString = [];
    try {
        ArrayString = JSON.parse(inputString);
    }
    catch (e) {
        ArrayString = [];
    }
    return ArrayString;
};
exports.convertMultiOptionsToStringArray = convertMultiOptionsToStringArray;
/**
 * Get variables
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {INodeData} nodeData
 */
const getVars = async (appDataSource, databaseEntities, nodeData) => {
    const variables = (await appDataSource.getRepository(databaseEntities['Variable']).find()) ?? [];
    // override variables defined in overrideConfig
    // nodeData.inputs.vars is an Object, check each property and override the variable
    if (nodeData?.inputs?.vars) {
        for (const propertyName of Object.getOwnPropertyNames(nodeData.inputs.vars)) {
            const foundVar = variables.find((v) => v.name === propertyName);
            if (foundVar) {
                // even if the variable was defined as runtime, we override it with static value
                foundVar.type = 'static';
                foundVar.value = nodeData.inputs.vars[propertyName];
            }
            else {
                // add it the variables, if not found locally in the db
                variables.push({ name: propertyName, type: 'static', value: nodeData.inputs.vars[propertyName] });
            }
        }
    }
    return variables;
};
exports.getVars = getVars;
/**
 * Prepare sandbox variables
 * @param {IVariable[]} variables
 */
const prepareSandboxVars = (variables) => {
    let vars = {};
    if (variables) {
        for (const item of variables) {
            let value = item.value;
            // read from .env file
            if (item.type === 'runtime') {
                value = process.env[item.name] ?? '';
            }
            Object.defineProperty(vars, item.name, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: value
            });
        }
    }
    return vars;
};
exports.prepareSandboxVars = prepareSandboxVars;
let version;
const getVersion = async () => {
    if (version != null)
        return { version };
    const checkPaths = [
        path.join(__dirname, '..', 'package.json'),
        path.join(__dirname, '..', '..', 'package.json'),
        path.join(__dirname, '..', '..', '..', 'package.json'),
        path.join(__dirname, '..', '..', '..', '..', 'package.json'),
        path.join(__dirname, '..', '..', '..', '..', '..', 'package.json')
    ];
    for (const checkPath of checkPaths) {
        try {
            const content = await fs.promises.readFile(checkPath, 'utf8');
            const parsedContent = JSON.parse(content);
            version = parsedContent.version;
            return { version };
        }
        catch {
            continue;
        }
    }
    throw new Error('None of the package.json paths could be parsed');
};
exports.getVersion = getVersion;
/**
 * Map Ext to InputField
 * @param {string} ext
 * @returns {string}
 */
const mapExtToInputField = (ext) => {
    switch (ext) {
        case '.txt':
            return 'txtFile';
        case '.pdf':
            return 'pdfFile';
        case '.json':
            return 'jsonFile';
        case '.csv':
        case '.xls':
        case '.xlsx':
            return 'csvFile';
        case '.jsonl':
            return 'jsonlinesFile';
        case '.docx':
        case '.doc':
            return 'docxFile';
        case '.yaml':
            return 'yamlFile';
        default:
            return 'txtFile';
    }
};
exports.mapExtToInputField = mapExtToInputField;
/**
 * Map MimeType to InputField
 * @param {string} mimeType
 * @returns {string}
 */
const mapMimeTypeToInputField = (mimeType) => {
    switch (mimeType) {
        case 'text/plain':
            return 'txtFile';
        case 'application/pdf':
            return 'pdfFile';
        case 'application/json':
            return 'jsonFile';
        case 'text/csv':
            return 'csvFile';
        case 'application/json-lines':
        case 'application/jsonl':
        case 'text/jsonl':
            return 'jsonlinesFile';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'docxFile';
        case 'application/vnd.yaml':
        case 'application/x-yaml':
        case 'text/vnd.yaml':
        case 'text/x-yaml':
        case 'text/yaml':
            return 'yamlFile';
        default:
            return 'txtFile';
    }
};
exports.mapMimeTypeToInputField = mapMimeTypeToInputField;
/**
 * Map MimeType to Extension
 * @param {string} mimeType
 * @returns {string}
 */
const mapMimeTypeToExt = (mimeType) => {
    switch (mimeType) {
        case 'text/plain':
            return 'txt';
        case 'application/pdf':
            return 'pdf';
        case 'application/json':
            return 'json';
        case 'text/csv':
            return 'csv';
        case 'application/json-lines':
        case 'application/jsonl':
        case 'text/jsonl':
            return 'jsonl';
        case 'application/msword':
            return 'doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'docx';
        case 'application/vnd.ms-excel':
            return 'xls';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'xlsx';
        default:
            return '';
    }
};
exports.mapMimeTypeToExt = mapMimeTypeToExt;
// remove invalid markdown image pattern: ![<some-string>](<some-string>)
const removeInvalidImageMarkdown = (output) => {
    return typeof output === 'string' ? output.replace(/!\[.*?\]\((?!https?:\/\/).*?\)/g, '') : output;
};
exports.removeInvalidImageMarkdown = removeInvalidImageMarkdown;
/**
 * Extract output from array
 * @param {any} output
 * @returns {string}
 */
const extractOutputFromArray = (output) => {
    if (Array.isArray(output)) {
        return output.map((o) => o.text).join('\n');
    }
    else if (typeof output === 'object') {
        if (output.text)
            return output.text;
        else
            return JSON.stringify(output);
    }
    return output;
};
exports.extractOutputFromArray = extractOutputFromArray;
/**
 * Loop through the object and replace the key with the value
 * @param {any} obj
 * @param {any} sourceObj
 * @returns {any}
 */
const resolveFlowObjValue = (obj, sourceObj) => {
    if (typeof obj === 'object' && obj !== null) {
        const resolved = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            const value = obj[key];
            resolved[key] = (0, exports.resolveFlowObjValue)(value, sourceObj);
        }
        return resolved;
    }
    else if (typeof obj === 'string' && obj.startsWith('$flow')) {
        return (0, commonUtils_1.customGet)(sourceObj, obj);
    }
    else {
        return obj;
    }
};
exports.resolveFlowObjValue = resolveFlowObjValue;
const handleDocumentLoaderOutput = (docs, output) => {
    if (output === 'document') {
        return docs;
    }
    else {
        let finaltext = '';
        for (const doc of docs) {
            finaltext += `${doc.pageContent}\n`;
        }
        return handleEscapeCharacters(finaltext, false);
    }
};
exports.handleDocumentLoaderOutput = handleDocumentLoaderOutput;
const parseDocumentLoaderMetadata = (metadata) => {
    if (!metadata)
        return {};
    if (typeof metadata !== 'object') {
        return JSON.parse(metadata);
    }
    return metadata;
};
exports.parseDocumentLoaderMetadata = parseDocumentLoaderMetadata;
const handleDocumentLoaderMetadata = (docs, _omitMetadataKeys, metadata = {}, sourceIdKey) => {
    let omitMetadataKeys = [];
    if (_omitMetadataKeys) {
        omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
    }
    metadata = (0, exports.parseDocumentLoaderMetadata)(metadata);
    return docs.map((doc) => ({
        ...doc,
        metadata: _omitMetadataKeys === '*'
            ? metadata
            : (0, lodash_1.omit)({
                ...metadata,
                ...doc.metadata,
                ...(sourceIdKey ? { [sourceIdKey]: doc.metadata[sourceIdKey] || sourceIdKey } : undefined)
            }, omitMetadataKeys)
    }));
};
exports.handleDocumentLoaderMetadata = handleDocumentLoaderMetadata;
const handleDocumentLoaderDocuments = async (loader, textSplitter) => {
    let docs = [];
    if (textSplitter) {
        let splittedDocs = await loader.load();
        splittedDocs = await textSplitter.splitDocuments(splittedDocs);
        docs = splittedDocs;
    }
    else {
        docs = await loader.load();
    }
    return docs;
};
exports.handleDocumentLoaderDocuments = handleDocumentLoaderDocuments;
// Define a configurable API base URL
// This can be set via environment variable or default to localhost:3000
const getApiBaseUrl = () => {
    // Check for environment variable
    if (typeof process !== 'undefined' && process.env && process.env.REMODL_API_BASE_URL) {
        return process.env.REMODL_API_BASE_URL;
    }
    // Default to localhost:3000
    return 'http://localhost:3000';
};
exports.getApiBaseUrl = getApiBaseUrl;
//# sourceMappingURL=utils.js.map