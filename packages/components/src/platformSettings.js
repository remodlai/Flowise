"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncryptionKey = exports.getPlatformSetting = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
/**
 * Get a platform setting from the server
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
const getPlatformSetting = async (key, defaultValue = '') => {
    try {
        // Use the configurable base URL
        const baseUrl = (0, utils_1.getApiBaseUrl)();
        const response = await axios_1.default.get(`${baseUrl}/api/v1/platform/settings/${key}`);
        if (response.data && response.data.success && response.data.data) {
            return response.data.data.value || defaultValue;
        }
        return defaultValue;
    }
    catch (error) {
        console.error(`Error retrieving platform setting ${key}:`, error);
        return defaultValue;
    }
};
exports.getPlatformSetting = getPlatformSetting;
/**
 * Get the encryption key from platform settings
 * @returns The encryption key or throws an error if not found
 */
const getEncryptionKey = async () => {
    try {
        // Get the encryption key from platform settings
        const encryptionKey = await (0, exports.getPlatformSetting)('ENCRYPTION_KEY', '');
        // If we got a valid encryption key from platform settings, use it
        if (encryptionKey && encryptionKey !== '') {
            return encryptionKey;
        }
        // If no encryption key is found, throw an error
        throw new Error('No encryption key found in platform settings. Please set the ENCRYPTION_KEY in platform settings.');
    }
    catch (error) {
        // Log the error and rethrow
        console.error('Error retrieving encryption key from platform settings:', error);
        throw error;
    }
};
exports.getEncryptionKey = getEncryptionKey;
exports.default = {
    getPlatformSetting: exports.getPlatformSetting,
    getEncryptionKey: exports.getEncryptionKey
};
//# sourceMappingURL=platformSettings.js.map