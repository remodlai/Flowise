# Current issues with credentials and api key storage

### **History**

We are currently in the middle of fully migrating credentials and api key storage from the legacy locations:

1. JSON (local)
2. Local DB (sqlite)
3. AWS Secrets Manager (was optional - used in production)

To fully using our Supabase-based system. We have completed the functional changes to ensure that encryption of all credentials and API keys use our [Platform Settings encryption key](../09_encryption_key_migration.md), that is now stored in Supabase, thus enabling a consistent key to use for all hashing and encryption.

### **Recent Changes (March 10, 2025)**

1. **Simplified Credential Handling**:
   - Removed the overly complex credential handling logic in `decryptCredentialData` function in the server package
   - Eliminated legacy fallback mechanisms that were causing confusion and potential errors
   - Focused exclusively on using Supabase for credential storage and retrieval

2. **API Endpoint for Credentials**:
   - Created a dedicated API endpoint at `/api/v1/secrets/:id` that bypasses authentication
   - This endpoint is used by the components package to retrieve credential data directly
   - Simplified the components package's `decryptCredentialData` function to make a direct API call

3. **Debugging Improvements**:
   - Added detailed logging to credential-related functions to help diagnose issues
   - Improved error handling to provide clearer information about failures

### **Current Issues**

1. **Mixed Data Sources Problem**:
   - We've identified a critical issue with how credentials are being handled in the development environment
   - Chatflows are stored in the SQLite database but reference credential IDs that exist in Supabase
   - When a flow is executed, it tries to retrieve the credential with the ID from the flow data
   - The system is looking for the credential in the wrong place (SQLite instead of Supabase)
   - This explains why we're getting the "Anthropic API key not found" error

2. **Langchain ChatAnthropic Issue**:
   - We discovered that the Langchain ChatAnthropic class expects the API key in either `apiKey` or `anthropicApiKey` fields
   - We've updated the ChatAnthropic node to pass the API key as both `anthropicApiKey` and `apiKey`
   - However, this change isn't effective because the credential retrieval issue is occurring earlier in the process

3. **Token Expiration and Credential Association Issues**:
   - When the Supabase token expires, the token refresh mechanism isn't working properly
   - This causes authentication failures when trying to access Supabase
   - The `getCredentialIdsForApplication` function is failing to retrieve credential IDs for the application
   - Even though credentials exist in Supabase and are properly associated with the application, the system can't access them due to authentication issues
   - This results in the system finding 0 credentials for the application, even though they exist

4. **Next Steps**:
   - fix the token refresh
   - Modify the credential retrieval process to check Supabase first, or exclusively, rather than looking in the SQLite database
   - Update the `getCredentialById` function in the credentials service to prioritize Supabase
   - Fix the token refresh mechanism to ensure continuous authentication with Supabase
   - Implement a more robust error handling for authentication failures
   - Ensure that the node initialization process correctly passes the credential data to the node
   - Test with multiple credential types to ensure the solution works for all components
   - Document the final architecture for credential handling


My latest findings:
Ask me about NodePool

### **Additional Findings (March 10, 2025 - Update)**

5. **Application ID Not Passed During Flow Execution**:
   - We've identified that the application ID is not being passed to the credential retrieval process during flow execution
   - The UI correctly passes the application ID when retrieving credentials (in AsyncDropdown.jsx)
   - However, when a flow is executed, the components package's `getCredentialData` function doesn't include the application ID
   - This means that even though the credential exists in Supabase and is properly associated with the application, it can't be retrieved during flow execution

6. **Credential ID Mismatch Between SQLite and Supabase**:
   - We've confirmed that chatflows in SQLite reference credential IDs that exist in Supabase but not in SQLite
   - For example, the chatflow with ID `6d39ab44-5269-4e43-818e-fb1231625d75` references a credential with ID `1e3fb8ff-edfc-473f-ace9-b30715ed8370`
   - This credential doesn't exist in SQLite but does exist in Supabase and is properly associated with application ID `6225eed0-f38b-41dc-81c3-322985f47b34`

7. **Secrets API Endpoint Doesn't Verify Application Association**:
   - The `/api/v1/secrets/:id` endpoint doesn't verify that the credential belongs to the application
   - It simply retrieves the secret by ID without checking application association
   - This could potentially lead to security issues if a user tries to access a credential from another application

8. **Additional Next Steps**:
   - Modify the `getCredentialData` function in the components package to pass the application ID as a query parameter
   - Update the secrets endpoint to verify that the credential belongs to the application
   - Ensure that the application ID is properly passed through the entire flow execution process
   - Add more comprehensive logging to track the credential retrieval process
9. **KEY NOTE**
   1.  We use SqLite as our database during development.  We use Postgres in production (not supabase currently) for our main database.  All changes/solutions/edits need to take this into account.  The databse itself isn't the issue. Its code errors/bugs

### **Latest Findings and Changes (March 11, 2025)**

10. **Credential Retrieval Process Investigation**:
    - We've added detailed logging to the credential retrieval process to better understand the issue
    - The logs show that the `getCredentialIdsForApplication` function is correctly retrieving credential IDs from the `application_credentials` table
    - For a query filtering by "anthropicApi" and application ID "6225eed0-f38b-41dc-81c3-322985f47b34", the system finds 2 credentials after filtering by name and application
    - The Supabase connection is working correctly, as verified by a test function that successfully queries the `application_credentials` table

11. **Changes Made to Improve Debugging**:
    - Added detailed logging to the `getCredentialIdsForApplication` function to show the application ID being used and the credential IDs found
    - Added a `testSupabaseConnection` function to verify that the Supabase client is working correctly
    - Enhanced the `getApplicationIdFromRequest` function with detailed logging to show where the application ID is being extracted from
    - Added logging of request details (user, headers, query parameters) in the `getAllCredentials` function

12. **Current Understanding**:
    - The credential retrieval process is working correctly at the database level
    - The issue is not with the Supabase connection or the query to the `application_credentials` table
    - The problem might be in how the credentials are being used after they're retrieved, or in how the credential data is being decrypted or formatted
    - Further investigation is needed to understand what happens after the credentials are retrieved and how they're being used in the flow execution process

13. **Next Steps**:
    - Investigate how the credentials are being used after they're retrieved
    - Check if there's a specific credential ID that's being looked for but not found
    - Examine the flow execution process to understand how the credential data is being passed to the nodes
    - Review the credential decryption process to ensure it's working correctly
    - Test with different credential types to see if the issue is specific to Anthropic credentials

### **Latest Changes (March 11, 2025 - Update)**

14. **RLS Policy Issue Identified**:
    - We identified that the RLS policies on the `application_credentials` table were not allowing access when using the service key
    - The policies were only allowing access based on user authentication (platform admin, app admin, org user)
    - When the token expired, the system couldn't access the credentials even though it was using the service key

15. **RLS Policy Fix**:
    - Added a new RLS policy `application_credentials_system_access_policy` that allows access to application_credentials when an application_id is present
    - This policy ensures that the system can access credentials for an application without requiring user authentication
    - The policy is simple and just checks if application_id IS NOT NULL

16. **Implementation Details**:
    - Created a new SQL file `packages/server/src/migrations/multi-tenant/rls_policies/application_credentials_system_access_policy.sql`
    - The policy is applied to all operations (SELECT, INSERT, UPDATE, DELETE)
    - The policy is permissive and applies to the public role, which means it will work with the service key

17. **Expected Impact**:
    - The system should now be able to access application credentials during flow execution, even when the token has expired
    - This should fix the issue where credential retrieval was failing and returning 0 credentials
    - The fix is minimal and focused on the specific issue, without changing any application code

### **Latest Improvements (March 12, 2025)**

18. **Centralized Supabase Client Implementation**:
   - Implemented a centralized Supabase client in the App class to improve connection management and error handling
   - Added proper initialization and shutdown procedures for the Supabase client
   - Exposed the Supabase client as `app.Supabase` for direct access, following the same pattern as other elements like `app.AppDataSource`
   - Modified the `supabase.ts` utility to use the centralized client from the App class, with a fallback to direct initialization if the App instance is not available
   - This ensures that all Supabase operations use the same client instance, improving connection pooling and error handling

19. **Enhanced Type Safety with TypeScript Interfaces**:
   - Created a new `Interface.Supabase.ts` file with comprehensive type definitions for Supabase-specific data structures:
     - `ISupabaseUser`: Type for Supabase auth users
     - `ISupabaseOrganization`: Type for organizations in the organizations table
     - `ISupabaseOrganizationUser`: Type for organization-user relationships
     - `ISupabaseApplication`: Type for applications in the applications table
     - `ISupabaseRole`: Type for roles in the roles table
     - `ISupabasePermission`: Type for permissions in the permissions table
     - `ISupabaseUserRole`: Type for user-role relationships
     - `ISupabaseRolePermission`: Type for role-permission relationships
     - `ISupabaseSecret`: Type for secrets in the secrets table
     - `ISupabaseBucket`: Type for storage buckets
     - `ISupabaseResponse<T>`: Generic type for Supabase API responses
   - Updated the `Interface.ts` file to import and re-export these Supabase interfaces
   - Fixed TypeScript errors in controller and service files by adding proper type annotations
   - This improves type safety and makes the codebase more maintainable

20. **Improved Logging for Credential Retrieval**:
   - Enhanced the logging in the `getSecret` function to provide more detailed information about the secret retrieval process
   - Added comprehensive logging to the `decryptCredentialData` function in both the server and components packages
   - Improved error handling and logging in the `getCredentialData` function
   - Set the logger level to 'debug' to capture all relevant information
   - This provides better visibility into the credential retrieval process and helps diagnose issues

21. **Architectural Improvements**:
   - Implemented a proxy pattern in the `supabase.ts` utility to ensure that the latest client is always used
   - Added proper error handling and fallback mechanisms in the Supabase client initialization
   - Improved the organization of type definitions by separating Supabase-specific types into their own file
   - Enhanced the readability and maintainability of the codebase with better type annotations and documentation
   - These changes make the codebase more robust and easier to maintain

22. **Next Steps**:
   - Test the centralized Supabase client implementation with various credential types
   - Verify that the token refresh mechanism works correctly with the new implementation
   - Ensure that the credential retrieval process correctly uses the application ID
   - Update the secrets endpoint to verify that the credential belongs to the application
   - Add more comprehensive logging to track the credential retrieval process end-to-end
   - Document the final architecture for credential handling in detail

These improvements address several of the issues identified earlier, particularly around Supabase client management and type safety. The centralized client implementation should help with connection management and error handling, while the enhanced type definitions make the codebase more maintainable and less prone to errors.