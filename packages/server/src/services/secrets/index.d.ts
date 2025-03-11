/**
 * Store a secret in Supabase
 * @param name Name of the secret
 * @param type Type of secret (api_key, credential, etc.)
 * @param value Value to encrypt and store
 * @param metadata Additional metadata
 * @param keyId Optional key ID for API keys
 * @returns The ID of the stored secret
 */
export declare const storeSecret: (name: string, type: string, value: any, metadata?: any, keyId?: string) => Promise<string>;
/**
 * Retrieve and decrypt a secret from Supabase
 * @param id ID of the secret to retrieve
 * @param applicationId Optional application ID to filter by
 * @returns The decrypted secret value
 */
export declare const getSecret: (id: string, applicationId?: string) => Promise<any>;
/**
 * Retrieve a secret by its key ID
 * @param keyId Key ID of the secret to retrieve
 * @param applicationId Optional application ID to filter by
 * @returns The decrypted secret value
 */
export declare const getSecretByKeyId: (keyId: string, applicationId?: string) => Promise<any>;
/**
 * Update a secret in Supabase
 * @param id ID of the secret to update
 * @param value New value to encrypt and store
 * @param metadata Optional new metadata to store
 */
export declare const updateSecret: (id: string, value: any, metadata?: any) => Promise<void>;
/**
 * Delete a secret from Supabase
 * @param id ID of the secret to delete
 */
export declare const deleteSecret: (id: string) => Promise<void>;
/**
 * List all secrets of a specific type
 * @param type Type of secrets to list
 * @returns Array of secrets with their metadata
 */
export declare const listSecrets: (type: string) => Promise<any[]>;
