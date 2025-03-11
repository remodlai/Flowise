We are working through auth issues and correcting RLS, etc.

## Critical Issue Identified: JWT Token Used as Key ID (March 13, 2025)

### Problem Description

After analyzing the server error logs, we've identified a critical issue where the entire JWT token is being incorrectly used as a key ID when trying to retrieve secrets from Supabase. This is causing "Secret not found" errors because we're looking for a secret with a key ID that matches the entire JWT token, which doesn't exist.

Error from logs:
```
Secret not found with key ID: eyJhbGciOiJIUzI1NiIsImtpZCI6Ilp5eldWNEQ0dUVndzdTQkoiLCJ0eXAiOiJKV1QifQ.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0MTY1NzI4NX1dLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwiYXVkIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoiYnJpYW4rdGVzdEByZW1vZGwuYWkiLCJleHAiOjE3NDE2NjA4ODUsImZpcnN0X25hbWUiOiJCcmlhbiIsImlhdCI6MTc0MTY1NzI4NSwiaXNfYW5vbnltb3VzIjpmYWxzZSwiaXNfcGxhdGZvcm1fYWRtaW4iOnRydWUsImlzcyI6Imh0dHBzOi8vdm9rc2p0anJzaG9uamFkd2pvenQuc3VwYWJhc2UuY28vYXV0aC92MSIsImxhc3RfbmFtZSI6IkJhZ2Rhc2FyaWFuIiwib3JnX2RlYnVnX2luZm8iOnsib3JnX2lkX2ZvdW5kIjp0cnVlLCJvcmdfaWRfZnJvbV9wcm9maWxlIjoiYTQyMzM3NzMtNDEyOC00MTQ5LTgyYTEtNzVkYjI1ZGQ0NjBmIiwib3JnX2xvb2t1cF9zdGFydGVkIjp0cnVlfSwib3JnYW5pemF0aW9uSWQiOiJhNDIzMzc3My00MTI4LTQxNDktODJhMS03NWRiMjVkZDQ2MGYiLCJvcmdhbml6YXRpb25fbmFtZSI6IlJlbW9kbCBBSSIsInBob25lIjoiIiwicHJvZmlsZV9yb2xlIjoicGxhdGZvcm1fYWRtaW4iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiJjZWQ4YmI4YS04NGU5LTQzMzctOWVjZC02NTJkMzc3NGE0YjAiLCJzdWIiOiJhMjEzMmZlNi1iYzBkLTQ0OWYtODM2MS1jNWU1YjU5OGUwZTYiLCJ0ZXN0X2NsYWltIjoiQ1VTVE9NX0FDQ0VTU19UT0tFTl9IT09LX1dPUktJTkciLCJ1c2VySWQiOiJhMjEzMmZlNi1iYzBkLTQ0OWYtODM2MS1jNWU1YjU5OGUwZTYiLCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJyb2xlIjoicGxhdGZvcm1fYWRtaW4ifSwidXNlcl9yb2xlcyI6W3sicmVzb3VyY2VfaWQiOm51bGwsInJlc291cmNlX3R5cGUiOm51bGwsInJvbGUiOiJwbGF0Zm9ybV9hZG1pbiJ9XX0.gm1TcL2EdobJCjVfTrr0MpNwxtEHuwokzzJ-sKByMFM
```

### Root Cause Analysis

1. The issue appears to be in the authentication flow where the JWT token from the Authorization header is being passed directly to the `getSecretByKeyId` function instead of extracting the actual credential ID.

2. This is likely happening in the API key authentication middleware or in the credential retrieval process during flow execution.

3. The JWT token is being used as a key ID, but it should be used to authenticate the user and then retrieve the appropriate credential ID based on the application context.

4. The RLS policies are also not properly aligned with our JWT claims structure, causing authentication failures even when using the service key.

### Proposed Solution

1. **Fix the JWT as Key ID Bug**:
   - Identify where in the code we're incorrectly using the JWT as a key ID
   - Ensure we're properly extracting the actual credential ID from the request
   - Update the authentication flow to use the JWT for authentication only, not as a credential ID

2. **Update RLS Policies**:
   - Modify policies to check for both built-in roles and dynamic roles
   - Use the `authorize` function in policies to check permissions
   - Ensure policies match the JWT claims structure we're using

3. **Standardize Application ID Handling**:
   - Create a unified function to extract application ID from various sources (body, query, headers)
   - Ensure consistent application ID passing throughout the codebase
   - Update the credential retrieval process to always include the application ID

4. **Implement Proper Token Refresh**:
   - Add token refresh logic that works with both user authentication and API keys
   - Handle expired tokens gracefully
   - Use the service key for operations that don't require user context

5. **Leverage Existing Authorization Functions**:
   - Use `authorize` and `authorize.resource` functions for permission checks
   - Ensure these functions work with both built-in and dynamic roles

### Next Steps

1. Identify the specific code location where the JWT is being used as a key ID
2. Fix the immediate issue to unblock credential retrieval
3. Implement a more comprehensive solution for JWT claims and RLS policies
4. Test with various credential types and authentication methods
5. Document the final solution in detail

### Implementation Plan

1. First, we'll focus on fixing the JWT as key ID bug, as this is the most critical issue
2. Then we'll update the RLS policies to match our JWT claims structure
3. Finally, we'll implement proper token refresh and standardize application ID handling