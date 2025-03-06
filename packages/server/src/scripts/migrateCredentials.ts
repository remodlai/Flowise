import { storeSecret } from '../services/secrets'
import { AES, enc } from 'crypto-js'
import { getEncryptionKey } from '../utils'
import logger from '../utils/logger'
import { DataSource } from 'typeorm'
import { Credential } from '../database/entities/Credential'
import path from 'path'

/**
 * One-time migration script to move credentials from local storage or AWS Secrets Manager to Supabase
 * 
 * This script should be run once to migrate existing credentials to Supabase.
 * After migration, all credential operations will use Supabase directly.
 */
const migrateCredentials = async () => {
    try {
        console.log('Starting credentials migration to Supabase...')
        
        // Create a new DataSource instance
        const appDataSource = new DataSource({
            type: process.env.DATABASE_TYPE as any || 'sqlite',
            database: process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite'),
            synchronize: true,
            entities: [Credential],
            migrations: [],
            subscribers: []
        })
        
        // Initialize the DataSource
        await appDataSource.initialize()
        console.log('Database connection initialized')
        
        // Get all credentials
        const credentials = await appDataSource.getRepository(Credential).find()
        console.log(`Found ${credentials.length} credentials to migrate`)
        
        // Get the encryption key for local credentials
        const encryptKey = await getEncryptionKey()
        
        // Migrate each credential to Supabase
        let successCount = 0
        let failCount = 0
        
        for (const credential of credentials) {
            console.log(`Migrating credential: ${credential.name} (${credential.credentialName})`)
            
            try {
                let plainDataObj: any = {}
                
                // Check if this is an AWS Secrets Manager secret
                if (credential.encryptedData.startsWith('FlowiseCredential_')) {
                    console.log(`  - AWS Secrets Manager credential detected`)
                    // Skip for now as we don't have direct access to AWS Secrets Manager in this script
                    console.log(`  - Skipping AWS Secrets Manager credential: ${credential.name}`)
                    failCount++
                    continue
                } else {
                    // Decrypt the credential data using the local encryption key
                    try {
                        const decryptedData = AES.decrypt(credential.encryptedData, encryptKey)
                        const decryptedDataStr = decryptedData.toString(enc.Utf8)
                        plainDataObj = JSON.parse(decryptedDataStr)
                    } catch (error) {
                        console.error(`  - Error decrypting credential ${credential.name}:`, error)
                        failCount++
                        continue
                    }
                }
                
                // Store in Supabase
                const secretId = await storeSecret(
                    credential.name,
                    'credential',
                    plainDataObj,
                    { 
                        credentialId: credential.id,
                        type: credential.credentialName
                    }
                )
                
                // Update the credential with the new secret ID
                credential.encryptedData = secretId
                await appDataSource.getRepository(Credential).save(credential)
                
                console.log(`  - Successfully migrated credential: ${credential.name}`)
                successCount++
            } catch (error) {
                console.error(`  - Error migrating credential ${credential.name}:`, error)
                failCount++
            }
        }
        
        console.log(`Migration completed. ${successCount} credentials migrated successfully, ${failCount} failed.`)
        if (failCount > 0) {
            console.log('Please check the logs for details on failed migrations.')
        }
        
        // Close the database connection
        await appDataSource.destroy()
        console.log('Database connection closed')
    } catch (error) {
        console.error('Error during migration:', error)
    }
}

// Run the migration
migrateCredentials() 