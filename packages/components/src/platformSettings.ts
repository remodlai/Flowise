import axios from 'axios'
import { getApiBaseUrl } from './utils'

/**
 * Get a platform setting from the server
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
export const getPlatformSetting = async (key: string, defaultValue: string = ''): Promise<string> => {
    try {
        // Use the configurable base URL
        const baseUrl = getApiBaseUrl()
        const response = await axios.get(`${baseUrl}/api/v1/platform/settings/${key}`)
        
        if (response.data && response.data.success && response.data.data) {
            return response.data.data.value || defaultValue
        }
        
        return defaultValue
    } catch (error) {
        console.error(`Error retrieving platform setting ${key}:`, error)
        return defaultValue
    }
}

/**
 * Get the encryption key from platform settings
 * @returns The encryption key or throws an error if not found
 */
export const getEncryptionKey = async (): Promise<string> => {
    try {
        // Get the encryption key from platform settings
        const encryptionKey = await getPlatformSetting('ENCRYPTION_KEY', '')
        
        // If we got a valid encryption key from platform settings, use it
        if (encryptionKey && encryptionKey !== '') {
            return encryptionKey
        }
        
        // If no encryption key is found, throw an error
        throw new Error('No encryption key found in platform settings. Please set the ENCRYPTION_KEY in platform settings.')
    } catch (error) {
        // Log the error and rethrow
        console.error('Error retrieving encryption key from platform settings:', error)
        throw error
    }
}

export default {
    getPlatformSetting,
    getEncryptionKey
} 