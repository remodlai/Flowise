/**
 * Get a platform setting from the server
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
export declare const getPlatformSetting: (key: string, defaultValue?: string) => Promise<string>;
/**
 * Get the encryption key from platform settings
 * @returns The encryption key or throws an error if not found
 */
export declare const getEncryptionKey: () => Promise<string>;
declare const _default: {
    getPlatformSetting: (key: string, defaultValue?: string) => Promise<string>;
    getEncryptionKey: () => Promise<string>;
};
export default _default;
