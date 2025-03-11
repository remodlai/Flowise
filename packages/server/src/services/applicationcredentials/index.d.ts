/**
 * Get the application ID for a credential
 * @param credentialId The ID of the credential
 * @returns The application ID or null if not found
 */
export declare const getApplicationIdForCredential: (credentialId: string) => Promise<string | null>;
/**
 * Get all credential IDs for an application
 * @param applicationId The ID of the application
 * @param req Optional request object (not used)
 * @returns Array of credential IDs
 */
export declare const getCredentialIdsForApplication: (applicationId: string, req?: any) => Promise<string[]>;
/**
 * Associate a credential with an application
 * @param credentialId The ID of the credential
 * @param applicationId The ID of the application
 * @returns True if successful, false otherwise
 */
export declare const associateCredentialWithApplication: (credentialId: string, applicationId: string) => Promise<boolean>;
/**
 * Remove a credential's association with any application
 * @param credentialId The ID of the credential
 * @returns True if successful, false otherwise
 */
export declare const removeCredentialAssociation: (credentialId: string) => Promise<boolean>;
/**
 * Get the default application ID
 * @returns The default application ID or null if not found
 */
export declare const getDefaultApplicationId: () => Promise<string | null>;
/**
 * Check if a user is a platform admin
 * @param userId The ID of the user
 * @returns True if the user is a platform admin, false otherwise
 */
export declare const isUserPlatformAdmin: (userId: string) => Promise<boolean>;
/**
 * Test the Supabase connection
 * @returns True if successful, false otherwise
 */
export declare const testSupabaseConnection: () => Promise<boolean>;
declare const _default: {
    getApplicationIdForCredential: (credentialId: string) => Promise<string | null>;
    getCredentialIdsForApplication: (applicationId: string, req?: any) => Promise<string[]>;
    associateCredentialWithApplication: (credentialId: string, applicationId: string) => Promise<boolean>;
    removeCredentialAssociation: (credentialId: string) => Promise<boolean>;
    getDefaultApplicationId: () => Promise<string | null>;
    isUserPlatformAdmin: (userId: string) => Promise<boolean>;
    testSupabaseConnection: () => Promise<boolean>;
};
export default _default;
