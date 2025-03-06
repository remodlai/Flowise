import { encryptCredentialData, decryptCredentialData } from '../utils'

/**
 * Test credential encryption and decryption
 */
const testCredential = async () => {
    try {
        console.log('Testing credential encryption and decryption...')
        
        // Create a test credential
        const testData = {
            apiKey: 'test-api-key',
            apiSecret: 'test-api-secret',
            baseURL: 'https://api.example.com'
        }
        
        console.log('Original data:', testData)
        
        // Encrypt the credential data
        console.log('Encrypting credential data...')
        const encryptedData = await encryptCredentialData(testData)
        console.log('Encrypted data:', encryptedData)
        
        // Decrypt the credential data
        console.log('Decrypting credential data...')
        const decryptedData = await decryptCredentialData(encryptedData)
        console.log('Decrypted data:', decryptedData)
        
        // Verify the decrypted data matches the original
        const isMatch = JSON.stringify(testData) === JSON.stringify(decryptedData)
        console.log('Data match:', isMatch)
        
        if (isMatch) {
            console.log('Test passed! Credential encryption and decryption are working correctly.')
        } else {
            console.log('Test failed! Decrypted data does not match original data.')
        }
    } catch (error) {
        console.error('Error testing credential encryption/decryption:', error)
    }
}

// Run the test
testCredential() 