# Secrets Management

## Overview

The Remodl AI platform uses different approaches to secrets management depending on the environment (development vs. production). This document explains how secrets are managed in each environment and the challenges associated with this approach.

## Secrets Types

The platform manages several types of secrets:

1. **API Keys**: Used for authenticating API requests
2. **Encryption Keys**: Used for encrypting sensitive data
3. **Credentials**: Used for accessing external services
4. **Supabase Credentials**: Used for accessing Supabase services

## Development Environment

In the development environment, secrets are stored locally:

### API Keys

- **Storage Type**: JSON file or database
- **Configuration**: `APIKEY_STORAGE_TYPE=json` or `APIKEY_STORAGE_TYPE=db`
- **Path**: Configured via `APIKEY_PATH` environment variable
- **Implementation**: `packages/server/src/utils/apiKey.ts` and `packages/server/src/services/apikey/index.ts`

### Encryption Keys

- **Storage Type**: Local file
- **Configuration**: `SECRETKEY_STORAGE_TYPE=local`
- **Path**: Configured via `SECRETKEY_PATH` environment variable
- **Override**: Can be overridden with `FLOWISE_SECRETKEY_OVERWRITE` environment variable
- **Implementation**: `packages/server/src/utils/index.ts` (getEncryptionKey function)

### Credentials

- **Storage Type**: Encrypted in the database
- **Encryption**: Uses the encryption key to encrypt/decrypt credential data
- **Implementation**: `packages/server/src/utils/index.ts` (encryptCredentialData and decryptCredentialData functions)

### Supabase Credentials

- **Storage Type**: Environment variables
- **Variables**:
  - `SUPABASE_URL`: URL of the Supabase instance
  - `SUPABASE_ANON_KEY`: Anonymous key for public operations
  - `SUPABASE_SERVICE_KEY`: Service key for admin operations
- **Implementation**: `packages/server/src/utils/supabase.ts`

## Production Environment

In the production environment, secrets are stored in AWS Secrets Manager:

### API Keys

- Same as development environment

### Encryption Keys and Credentials

- **Storage Type**: AWS Secrets Manager
- **Configuration**: `SECRETKEY_STORAGE_TYPE=aws`
- **AWS Configuration**:
  - `SECRETKEY_AWS_REGION`: AWS region
  - `SECRETKEY_AWS_ACCESS_KEY`: AWS access key
  - `SECRETKEY_AWS_SECRET_KEY`: AWS secret key
- **Implementation**: `packages/server/src/utils/index.ts` (encryptCredentialData and decryptCredentialData functions)

### Supabase Credentials

- Same as development environment

## Implementation Details

### AWS Secrets Manager Integration

The platform integrates with AWS Secrets Manager for storing encryption keys and credentials in production:

```typescript
// packages/server/src/utils/index.ts
import {
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
  SecretsManagerClientConfig
} from '@aws-sdk/client-secrets-manager'

let secretsManagerClient: SecretsManagerClient | null = null
const USE_AWS_SECRETS_MANAGER = process.env.SECRETKEY_STORAGE_TYPE === 'aws'

if (USE_AWS_SECRETS_MANAGER) {
  const region = process.env.SECRETKEY_AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.SECRETKEY_AWS_ACCESS_KEY
  const secretAccessKey = process.env.SECRETKEY_AWS_SECRET_KEY

  let credentials: SecretsManagerClientConfig['credentials'] | undefined
  if (accessKeyId && secretAccessKey) {
    credentials = {
      accessKeyId,
      secretAccessKey
    }
  }
  secretsManagerClient = new SecretsManagerClient({ credentials, region })
}
```

### Encrypting Credential Data

The platform encrypts credential data differently based on the environment:

```typescript
export const encryptCredentialData = async (plainDataObj: ICredentialDataDecrypted): Promise<string> => {
  if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
    const secretName = `FlowiseCredential_${randomBytes(12).toString('hex')}`
    const secretString = JSON.stringify({ ...plainDataObj })

    try {
      // Try to update the secret if it exists
      const putCommand = new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: secretString
      })
      await secretsManagerClient.send(putCommand)
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Secret doesn't exist, so create it
        const createCommand = new CreateSecretCommand({
          Name: secretName,
          SecretString: secretString
        })
        await secretsManagerClient.send(createCommand)
      } else {
        throw error
      }
    }
    return secretName
  }

  // Fallback to local encryption
  const encryptKey = await getEncryptionKey()
  return AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString()
}
```

### Decrypting Credential Data

Similarly, the platform decrypts credential data differently based on the environment:

```typescript
export const decryptCredentialData = async (
  encryptedData: string,
  componentCredentialName?: string,
  componentCredentials?: IComponentCredentials
): Promise<ICredentialDataDecrypted> => {
  let decryptedDataStr: string

  if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
    try {
      const command = new GetSecretValueCommand({ SecretId: encryptedData })
      const response = await secretsManagerClient.send(command)

      if (response.SecretString) {
        const secretObj = JSON.parse(response.SecretString)
        decryptedDataStr = JSON.stringify(secretObj)
      } else {
        throw new Error('Failed to retrieve secret value.')
      }
    } catch (error) {
      console.error(error)
      throw new Error('Failed to decrypt credential data.')
    }
  } else {
    // Fallback to local decryption
    const encryptKey = await getEncryptionKey()
    const decryptedData = AES.decrypt(encryptedData, encryptKey)
    decryptedDataStr = decryptedData.toString(enc.Utf8)
  }

  // Parse and return the decrypted data
  if (!decryptedDataStr) return {}
  try {
    return JSON.parse(decryptedDataStr)
  } catch (e) {
    console.error(e)
    return {}
  }
}
```

## Challenges

### 1. Environment Differences

The different approaches to secrets management between development and production create challenges:

- **Code Complexity**: The code needs to handle both local and AWS Secrets Manager storage
- **Configuration Management**: Different environment variables are needed for each environment
- **Testing**: Difficult to test production-like secrets management in development

### 2. API Key Integration

The API key system doesn't integrate well with the Supabase authentication system:

- **No Correlation**: There's no correlation between API keys and Supabase users
- **Authentication Mismatch**: API keys can't be used with endpoints protected by Supabase authentication
- **Different Storage**: API keys are stored differently than other secrets

### 3. Secret Rotation

The current implementation doesn't have a robust mechanism for secret rotation:

- **API Keys**: No automatic rotation of API keys
- **Encryption Keys**: No process for rotating encryption keys
- **AWS Credentials**: No rotation of AWS credentials

## Recommendations

### 1. Unified Secrets Management

Implement a unified approach to secrets management across environments:

- **Vault Integration**: Consider using HashiCorp Vault for secrets management
- **Environment Abstraction**: Create an abstraction layer for secrets management that works the same in all environments
- **Secret Service**: Implement a dedicated service for secrets management

### 2. API Key Bridge

Implement the API key bridge solution to integrate legacy API keys with Supabase auth:

- **Token Generation**: Generate temporary Supabase tokens for API key authentication
- **Permission Mapping**: Map API key permissions to Supabase roles and permissions
- **Audit Logging**: Log all API key authentications for security monitoring

### 3. Secret Rotation

Implement a robust secret rotation mechanism:

- **Automatic Rotation**: Automatically rotate secrets on a schedule
- **Version Management**: Support multiple versions of secrets during rotation
- **Graceful Transition**: Ensure clients can transition smoothly to new secrets

## Related Files

- `packages/server/src/utils/index.ts`: Contains encryption/decryption functions
- `packages/server/src/utils/apiKey.ts`: API key management
- `packages/server/src/services/apikey/index.ts`: API key service layer
- `packages/server/src/utils/supabase.ts`: Supabase client initialization
- `packages/server/.env.example`: Example environment configuration 