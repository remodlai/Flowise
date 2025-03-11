"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceAllAPIKeys = exports.deleteAPIKey = exports.updateAPIKey = exports.getApiKey = exports.importKeys = exports.addAPIKey = exports.getAPIKeys = exports.compareKeys = exports.generateSecretHash = exports.generateAPIKey = exports.getAPIKeyPath = void 0;
const crypto_1 = require("crypto");
const moment_1 = __importDefault(require("moment"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const AppConfig_1 = require("../AppConfig");
/**
 * Returns the api key path
 * @returns {string}
 */
const getAPIKeyPath = () => {
    return process.env.APIKEY_PATH ? path_1.default.join(process.env.APIKEY_PATH, 'api.json') : path_1.default.join(__dirname, '..', '..', 'api.json');
};
exports.getAPIKeyPath = getAPIKeyPath;
/**
 * Generate the api key
 * @returns {string}
 *
 *
 */
const generateAPIKey = () => {
    const buffer = (0, crypto_1.randomBytes)(32);
    return buffer.toString('base64url');
};
exports.generateAPIKey = generateAPIKey;
/**
 * Generate the secret key
 * @param {string} apiKey
 * @returns {string}
 */
const generateSecretHash = (apiKey) => {
    const salt = (0, crypto_1.randomBytes)(8).toString('hex');
    const buffer = (0, crypto_1.scryptSync)(apiKey, salt, 64);
    return `${buffer.toString('hex')}.${salt}`;
};
exports.generateSecretHash = generateSecretHash;
/**
 * Verify valid keys
 * @param {string} storedKey
 * @param {string} suppliedKey
 * @returns {boolean}
 */
const compareKeys = (storedKey, suppliedKey) => {
    const [hashedPassword, salt] = storedKey.split('.');
    const buffer = (0, crypto_1.scryptSync)(suppliedKey, salt, 64);
    return (0, crypto_1.timingSafeEqual)(Buffer.from(hashedPassword, 'hex'), buffer);
};
exports.compareKeys = compareKeys;
/**
 * Get API keys
 * @returns {Promise<ICommonObject[]>}
 */
const getAPIKeys = async () => {
    if (AppConfig_1.appConfig.apiKeys.storageType !== 'json') {
        return [];
    }
    try {
        const content = await fs_1.default.promises.readFile((0, exports.getAPIKeyPath)(), 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        const keyName = 'DefaultKey';
        const apiKey = (0, exports.generateAPIKey)();
        const apiSecret = (0, exports.generateSecretHash)(apiKey);
        const content = [
            {
                keyName,
                apiKey,
                apiSecret,
                createdAt: (0, moment_1.default)().format('DD-MMM-YY'),
                id: (0, crypto_1.randomBytes)(16).toString('hex')
            }
        ];
        await fs_1.default.promises.writeFile((0, exports.getAPIKeyPath)(), JSON.stringify(content), 'utf8');
        return content;
    }
};
exports.getAPIKeys = getAPIKeys;
/**
 * Add new API key
 * @param {string} keyName
 * @returns {Promise<ICommonObject[]>}
 *
 * REMODL TODO: When an api key is added, we need to add it to the supabase table for api keys for a given application and/or organization
 */
const addAPIKey = async (keyName) => {
    const existingAPIKeys = await (0, exports.getAPIKeys)();
    const apiKey = (0, exports.generateAPIKey)();
    const apiSecret = (0, exports.generateSecretHash)(apiKey);
    const content = [
        ...existingAPIKeys,
        {
            keyName,
            apiKey,
            apiSecret,
            createdAt: (0, moment_1.default)().format('DD-MMM-YY'),
            id: (0, crypto_1.randomBytes)(16).toString('hex')
        }
    ];
    await fs_1.default.promises.writeFile((0, exports.getAPIKeyPath)(), JSON.stringify(content), 'utf8');
    // REMODL TODO: Add the api key to the supabase table for api keys for a given application and/or organization
    return content;
};
exports.addAPIKey = addAPIKey;
/**
 * import API keys
 * @param {[]} keys
 * @returns {Promise<ICommonObject[]>}
 */
const importKeys = async (keys, importMode) => {
    const allApiKeys = await (0, exports.getAPIKeys)();
    // if importMode is errorIfExist, check for existing keys and raise error before any modification to the file
    if (importMode === 'errorIfExist') {
        for (const key of keys) {
            const keyNameExists = allApiKeys.find((k) => k.keyName === key.keyName);
            if (keyNameExists) {
                throw new Error(`Key with name ${key.keyName} already exists`);
            }
        }
    }
    for (const key of keys) {
        // Check if keyName already exists, if overwrite is false, raise an error else overwrite the key
        const keyNameExists = allApiKeys.find((k) => k.keyName === key.keyName);
        if (keyNameExists) {
            const keyIndex = allApiKeys.findIndex((k) => k.keyName === key.keyName);
            switch (importMode) {
                case 'overwriteIfExist':
                    allApiKeys[keyIndex] = key;
                    continue;
                case 'ignoreIfExist':
                    // ignore this key and continue
                    continue;
                case 'errorIfExist':
                    // should not reach here as we have already checked for existing keys
                    throw new Error(`Key with name ${key.keyName} already exists`);
                default:
                    throw new Error(`Unknown overwrite option ${importMode}`);
            }
        }
        allApiKeys.push(key);
    }
    await fs_1.default.promises.writeFile((0, exports.getAPIKeyPath)(), JSON.stringify(allApiKeys), 'utf8');
    // REMODL TODO: Add the api keys to the supabase table for api keys for a given application and/or organization
    return allApiKeys;
};
exports.importKeys = importKeys;
/**
 * Get API Key details
 * @param {string} apiKey
 * @returns {Promise<ICommonObject[]>}
 */
const getApiKey = async (apiKey) => {
    logger_1.default.debug('========= Start of getApiKey =========');
    logger_1.default.debug('apiKey', apiKey);
    logger_1.default.debug('========= End of getApiKey =========');
    console.log('========= Start of getApiKey =========');
    console.log('apiKey', apiKey);
    console.log('========= End of getApiKey =========');
    const existingAPIKeys = await (0, exports.getAPIKeys)();
    const keyIndex = existingAPIKeys.findIndex((key) => key.apiKey === apiKey);
    if (keyIndex < 0)
        return undefined;
    // REMODL TODO: Get the api key from the supabase table for api keys for a given application and/or organization
    return existingAPIKeys[keyIndex];
};
exports.getApiKey = getApiKey;
/**
 * Update existing API key
 * @param {string} keyIdToUpdate
 * @param {string} newKeyName
 * @returns {Promise<ICommonObject[]>}
 */
const updateAPIKey = async (keyIdToUpdate, newKeyName) => {
    const existingAPIKeys = await (0, exports.getAPIKeys)();
    const keyIndex = existingAPIKeys.findIndex((key) => key.id === keyIdToUpdate);
    if (keyIndex < 0)
        return [];
    existingAPIKeys[keyIndex].keyName = newKeyName;
    await fs_1.default.promises.writeFile((0, exports.getAPIKeyPath)(), JSON.stringify(existingAPIKeys), 'utf8');
    // REMODL TODO: Update the api key in the supabase table for api keys for a given application and/or organization
    return existingAPIKeys;
};
exports.updateAPIKey = updateAPIKey;
/**
 * Delete API key
 * @param {string} keyIdToDelete
 * @returns {Promise<ICommonObject[]>}
 */
const deleteAPIKey = async (keyIdToDelete) => {
    const existingAPIKeys = await (0, exports.getAPIKeys)();
    const result = existingAPIKeys.filter((key) => key.id !== keyIdToDelete);
    await fs_1.default.promises.writeFile((0, exports.getAPIKeyPath)(), JSON.stringify(result), 'utf8');
    // REMODL TODO: Delete the api key from the supabase table for api keys for a given application and/or organization
    return result;
};
exports.deleteAPIKey = deleteAPIKey;
/**
 * Replace all api keys
 * @param {ICommonObject[]} content
 * @returns {Promise<void>}
 */
const replaceAllAPIKeys = async (content) => {
    try {
        await fs_1.default.promises.writeFile((0, exports.getAPIKeyPath)(), JSON.stringify(content), 'utf8');
    }
    catch (error) {
        logger_1.default.error(error);
    }
};
exports.replaceAllAPIKeys = replaceAllAPIKeys;
//# sourceMappingURL=apiKey.js.map