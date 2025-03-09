import { supabase } from './supabase'
import logger from './logger'

/**
 * Get a platform setting from the platform_settings table
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
export const getPlatformSetting = async (key: string, defaultValue: string = ''): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle()
        
        if (error) {
            logger.error(`Error retrieving platform setting ${key}: ${error.message}`)
            return defaultValue
        }
        
        return data?.value || defaultValue
    } catch (error) {
        logger.error(`Error retrieving platform setting ${key}: ${error}`)
        return defaultValue
    }
}

/**
 * Set a platform setting in the platform_settings table
 * @param key The key of the setting to set
 * @param value The value to set
 * @param description Optional description of the setting
 * @param isEncrypted Whether the value is encrypted
 * @returns True if the setting was set successfully, false otherwise
 */
export const setPlatformSetting = async (
    key: string, 
    value: string, 
    description: string = '', 
    isEncrypted: boolean = false
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('platform_settings')
            .upsert({
                key,
                value,
                description,
                is_encrypted: isEncrypted,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            })
        
        if (error) {
            logger.error(`Error setting platform setting ${key}: ${error.message}`)
            return false
        }
        
        return true
    } catch (error) {
        logger.error(`Error setting platform setting ${key}: ${error}`)
        return false
    }
}

/**
 * Get the encryption key from platform settings
 * @returns The encryption key or the default value
 */
export const getEncryptionKey = async (): Promise<string> => {
    // First check if the environment variable is set
    if (process.env.FLOWISE_SECRETKEY_OVERWRITE) {
        return process.env.FLOWISE_SECRETKEY_OVERWRITE
    }
    
    // Otherwise get it from the platform settings
    return getPlatformSetting('ENCRYPTION_KEY', 'FLOWISE_REMODL_ENCRYPTION_KEY_CHANGE_ME')
}

export default {
    getPlatformSetting,
    setPlatformSetting,
    getEncryptionKey
} 