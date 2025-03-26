# RemodlAuth Methods Documentation

This document provides detailed documentation for the methods available in the RemodlAuth class.

## Authentication Methods

### signupForAppWithEmailPassword

Creates a new user account for a specific Remodl AI application using email and password authentication.

#### Method Signature
```typescript
async signupForAppWithEmailPassword(
    applicationId: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    redirectTarget: string
): Promise<AuthResponse>
```

#### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|-----------|
| applicationId | string | The unique ID of the Remodl AI application the user is signing up for | Yes |
| email | string | User's email address for login and communication | Yes |
| password | string | User's password (minimum 8 characters) | Yes |
| firstName | string | User's first name | Yes |
| lastName | string | User's last name | Yes |
| redirectTarget | string | URL to redirect to after email confirmation | Yes |

#### Authentication Flow

1. **Initial Request**: Creates user account and initiates PKCE flow
2. **Email Confirmation**: User receives confirmation email
3. **Verification**: User clicks confirmation link, redirecting to auth/confirm endpoint
4. **Token Exchange**: PKCE flow completes with token exchange
5. **Redirect**: User is redirected to specified redirectTarget with tokens in query params

#### Response Type

```typescript
interface AuthResponse {
    session: Session | null;  // null until email confirmation
    user: User | null;       // null until email confirmation
    error: Error | null;
}
```

#### Example Usage

```typescript
const auth = new RemodlAuth({
    // ... auth configuration
});

try {
    const response = await auth.signupForAppWithEmailPassword(
        "05955f73-4e1e-4323-9670-5cef6708ca69",  // Application ID
        "user@example.com",                       // Email
        "SecurePassword123!",                     // Password
        "John",                                   // First Name
        "Doe",                                    // Last Name
        "https://platform.remodl.ai/welcome/onboarding/step/1"  // Redirect Target
    );

    if (response.error) {
        console.error('Signup failed:', response.error);
        return;
    }

    // Success - user should check email for confirmation link
    console.log('Signup successful, check email for confirmation');
} catch (error) {
    console.error('Unexpected error:', error);
}
```

#### Example Response

On successful signup, the API returns user data with initial metadata:

```json
{
  "user": {
    "id": "857b131d-8d0b-4e05-84d9-1494745c0728",
    "email": "user@example.com",
    "user_metadata": {
      "appId": "05955f73-4e1e-4323-9670-5cef6708ca69",
      "appName": "Test Application",
      "displayName": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "isOnboarded": false,
      "email_verified": false
    }
  },
  "session": null
}
```

#### Important Notes

1. **Session Handling**
   - No session is returned immediately after signup
   - Session is only created after email confirmation
   - After successful email confirmation, user is redirected to the specified redirectTarget URL with tokens appended as query parameters
   
   Example redirect URL structure:
   ```
   https://platform.remodl.ai/welcome?access_token=${JWT_TOKEN}&refresh_token=${REFRESH_TOKEN}
   ```

   The access_token (JWT) contains the following key information:
   ```json
   {
     "aal": "aal1",
     "amr": [
       {
         "method": "otp",
         "timestamp": 1742959086
       }
     ],
     "app_metadata": {
       "provider": "email",
       "providers": ["email"]
     },
     "aud": ["authenticated"],
     "email": "user@remodl.ai",
     "exp": 1742962686,
     "iat": 1742959086,
     "is_anonymous": false,
     "is_platform_admin": false,
     "is_service_user": false,
     "user_metadata": {
       "appId": "05955f73-4e1e-4323-9670-5cef6708ca69",
       "appName": "Test Application",
       "displayName": "Jane Doe",
       "email": "user@remodl.ai",
       "email_verified": true,
       "firstName": "Jane",
       "lastName": "Doe",
       "phone_verified": false,
       "sub": "user-uuid"
     },
     "user_roles": [],
     "user_status": "active"
   }
   ```

2. **User Metadata**
   - `isOnboarded` is initially set to `false`
   - `email_verified` becomes `true` after confirmation
   - Application-specific metadata is included (`appId`, `appName`)
   - User profile information is included in `user_metadata`
   - Role and permission information is included in `user_roles`

3. **Security Considerations**
   - Uses PKCE flow for enhanced security
   - Password must be at least 8 characters
   - Email verification is required
   - Tokens are only provided after email confirmation
   - Access token includes comprehensive claims for authorization
   - Refresh token is provided for token renewal

4. **Token Handling**
   - Access token is a JWT that includes all user claims
   - Refresh token should be securely stored for token renewal
   - Access token includes:
     - User identity information
     - Application-specific metadata
     - Role-based access control data
     - Platform-level permissions
     - Token expiration and issuance timestamps

5. **Error Handling**
   - Returns structured error responses
   - Common error cases:
     - Invalid email format
     - Password too weak
     - Email already in use
     - Invalid application ID
     - Failed email verification
     - Invalid or expired confirmation link

#### Related Methods
- `getAccessToken()` - Retrieve the current access token
- `getDecodedJwt()` - Get the decoded JWT with all claims
- `signOut()` - Sign out the current user 