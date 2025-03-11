/**
 * Get a platform setting from the platform_settings table
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
export declare const getPlatformSetting: (key: string, defaultValue?: string) => Promise<string>;
/**
 * Set a platform setting in the platform_settings table
 * @param key The key of the setting to set
 * @param value The value to set
 * @param description Optional description of the setting
 * @param isEncrypted Whether the value is encrypted
 * @returns True if the setting was set successfully, false otherwise
 */
export declare const setPlatformSetting: (key: string, value: string, description?: string, isEncrypted?: boolean) => Promise<boolean>;
/**
 * Get the encryption key from platform settings
 * @returns The encryption key or throws an error if not found
 */
export declare const getEncryptionKey: () => Promise<string>;
declare const _default: {
    getPlatformSetting: (key: string, defaultValue?: string) => Promise<string>;
    setPlatformSetting: (key: string, value: string, description?: string, isEncrypted?: boolean) => Promise<boolean>;
    getEncryptionKey: () => Promise<string>;
};
export default _default;
