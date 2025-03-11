/**
 * Get the application ID for a tool
 * @param toolId
 * @returns
 */
export declare const getApplicationIdForTool: (toolId: string) => Promise<string | null>;
/**
 * Get all tool IDs for an application
 * @param applicationId
 * @returns
 */
export declare const getToolIdsForApplication: (applicationId: string) => Promise<string[]>;
/**
 * Associate a tool with an application
 * @param toolId
 * @param applicationId
 * @returns
 */
export declare const associateToolWithApplication: (toolId: string, applicationId: string) => Promise<boolean>;
/**
 * Remove a tool's association with any application
 * @param toolId
 * @returns
 */
export declare const removeToolAssociation: (toolId: string) => Promise<boolean>;
/**
 * Get the default application ID (Platform Sandbox)
 * @returns
 */
export declare const getDefaultApplicationId: () => Promise<string | null>;
/**
 * Get all applications for a user
 * @param userId
 * @returns
 */
export declare const getUserApplications: (userId: string) => Promise<any[]>;
/**
 * Check if a user is a platform admin
 * @param userId
 * @returns
 */
export declare const isUserPlatformAdmin: (userId: string) => Promise<boolean>;
declare const _default: {
    getApplicationIdForTool: (toolId: string) => Promise<string | null>;
    getToolIdsForApplication: (applicationId: string) => Promise<string[]>;
    associateToolWithApplication: (toolId: string, applicationId: string) => Promise<boolean>;
    removeToolAssociation: (toolId: string) => Promise<boolean>;
    getDefaultApplicationId: () => Promise<string | null>;
    getUserApplications: (userId: string) => Promise<any[]>;
    isUserPlatformAdmin: (userId: string) => Promise<boolean>;
};
export default _default;
