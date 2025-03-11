import { getAPIKeys } from '../utils/apiKey'
import { storeSecret } from '../services/secrets'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { ApiKey } from '../database/entities/ApiKey'
import { appConfig } from '../AppConfig'
import logger from '../utils/logger'
import { ICommonObject } from 'flowise-components'

/**
 * One-time migration script to move API keys from JSON or DB to Supabase
 * 
 * This script should be run once to migrate existing API keys to Supabase.
 * After migration, all API key operations will use Supabase directly.
 */
const migrateApiKeys = async () => {
    try {
        console.log('Starting API key migration to Supabase...')
        
        let existingKeys: any[] = []
        let sourceType = 'unknown'
        
        // Get existing API keys from JSON
        if (appConfig.apiKeys.storageType === 'json') {
            console.log('Migrating API keys from JSON storage...')
            existingKeys = await getAPIKeys()
            sourceType = 'json'
        } 
        // Get existing API keys from DB
        else if (appConfig.apiKeys.storageType === 'db') {
            console.log('Migrating API keys from database storage...')
            const appServer = getRunningExpressApp()
            existingKeys = await appServer.AppDataSource.getRepository(ApiKey).find()
            sourceType = 'database'
        }
        else {
            console.log('Unknown storage type. Please set APIKEY_STORAGE_TYPE to "json" or "db".')
            return
        }
        
        console.log(`Found ${existingKeys.length} API keys to migrate from ${sourceType}`)
        
        // Migrate each key to Supabase
        for (const key of existingKeys) {
            console.log(`Migrating key: ${key.keyName}`)
            
            try {
                await storeSecret(
                    key.keyName,
                    'api_key',
                    { apiKey: key.apiKey, apiSecret: key.apiSecret },
                    { keyName: key.keyName, createdAt: key.createdAt || new Date().toISOString() },
                    key.apiKey
                )
                console.log(`Successfully migrated key: ${key.keyName}`)
            } catch (error) {
                console.error(`Error migrating key ${key.keyName}:`, error)
            }
        }
        
        console.log(`Migration completed. ${existingKeys.length} API keys migrated from ${sourceType} to Supabase.`)
        console.log('Please update your environment configuration to use Supabase for API keys.')
    } catch (error) {
        console.error('Error during migration:', error)
    }
}

// Run the migration
migrateApiKeys() 