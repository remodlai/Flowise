"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncryptionKey = exports.setPlatformSetting = exports.getPlatformSetting = void 0;
const supabase_1 = require("./supabase");
const logger_1 = __importDefault(require("./logger"));
/**
 * Get a platform setting from the platform_settings table
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
const getPlatformSetting = async (key, defaultValue = '') => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('platform_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        if (error) {
            logger_1.default.error(`Error retrieving platform setting ${key}: ${error.message}`);
            return defaultValue;
        }
        return data?.value || defaultValue;
    }
    catch (error) {
        logger_1.default.error(`Error retrieving platform setting ${key}: ${error}`);
        return defaultValue;
    }
};
exports.getPlatformSetting = getPlatformSetting;
/**
 * Set a platform setting in the platform_settings table
 * @param key The key of the setting to set
 * @param value The value to set
 * @param description Optional description of the setting
 * @param isEncrypted Whether the value is encrypted
 * @returns True if the setting was set successfully, false otherwise
 */
const setPlatformSetting = async (key, value, description = '', isEncrypted = false) => {
    try {
        const { error } = await supabase_1.supabase
            .from('platform_settings')
            .upsert({
            key,
            value,
            description,
            is_encrypted: isEncrypted,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key'
        });
        if (error) {
            logger_1.default.error(`Error setting platform setting ${key}: ${error.message}`);
            return false;
        }
        return true;
    }
    catch (error) {
        logger_1.default.error(`Error setting platform setting ${key}: ${error}`);
        return false;
    }
};
exports.setPlatformSetting = setPlatformSetting;
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
        logger_1.default.error(`Error retrieving encryption key from platform settings: ${error}`);
        throw error;
    }
};
exports.getEncryptionKey = getEncryptionKey;
exports.default = {
    getPlatformSetting: exports.getPlatformSetting,
    setPlatformSetting: exports.setPlatformSetting,
    getEncryptionKey: exports.getEncryptionKey
};
//# sourceMappingURL=platformSettings.js.map