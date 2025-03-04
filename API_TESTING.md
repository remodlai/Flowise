# Supabase Auth API Testing Guide

This document provides guidance on how to test the Supabase Auth API endpoints that have been implemented for this application.

## Prerequisites

- [Postman](https://www.postman.com/downloads/) or curl installed
- Server running locally (typically on http://localhost:3000)
- Supabase project set up with environment variables configured

## Available Endpoints

### 1. User Login with Email/Password

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Expected Response (Success):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": 1234567890
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "your_password"}'
```

### 2. Magic Link Authentication

**Endpoint:** `POST /api/v1/auth/magic-link`

**Request Body:**
```json
{
  "email": "user@example.com",
  "redirectTo": "https://your-app.com/auth/callback" // Optional
}
```

**Expected Response (Success):**
```json
{
  "message": "Magic link sent successfully! Check your email.",
  "data": {}
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 3. Verify OTP from Magic Link

**Endpoint:** `POST /api/v1/auth/magic-link/verify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "123456" // One-time password received via email
}
```

**Expected Response (Success):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": 1234567890
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "token": "123456"}'
```

### 4. Exchange OAuth Code for Session (PKCE flow)

**Endpoint:** `POST /api/v1/auth/callback/exchange`

**Request Body:**
```json
{
  "code": "oauth_code_from_provider"
}
```

**Expected Response (Success):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": 1234567890
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/callback/exchange \
  -H "Content-Type: application/json" \
  -d '{"code": "oauth_code_from_provider"}'
```

### 5. Create User (Admin Only)

**Endpoint:** `POST /api/v1/auth/users`

**Headers:**
- Authorization: Bearer {your_token}

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "new_password"
}
```

**Expected Response (Success):**
```json
{
  "user": {
    "id": "new_user_id",
    "email": "newuser@example.com"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"email": "newuser@example.com", "password": "new_password"}'
```

### 6. Get Supabase Token (For Existing Authenticated User)

**Endpoint:** `GET /api/v1/auth/supabase-token`

**Headers:**
- Authorization: Bearer {your_token}

**Expected Response (Success):**
```json
{
  "token": "jwt_token_for_supabase"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/supabase-token \
  -H "Authorization: Bearer your_token_here"
```

## Social Login Flow

For Google and other OAuth providers, the flow works as follows:

1. **Initiate Login:** Redirect the user to the Supabase OAuth URL
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/authorize?provider=google&...
   ```

2. **Handle Callback:** After authentication, the provider redirects to your callback URL
   ```
   /api/v1/auth/callback
   ```

3. **Exchange Code:** Your client code exchanges the received code for a session
   ```
   POST /api/v1/auth/callback/exchange
   ```

## Testing Workflow

1. **Create Admin User (Initial Setup)**:
   If you're setting up the system for the first time, you may need to create an admin user directly in Supabase dashboard.

2. **Login**:
   Use one of the login methods (password, magic link, or social) to authenticate.

3. **Test Protected Endpoints**:
   Use the token from step 2 to authenticate requests to protected endpoints.

## Troubleshooting

- **401 Unauthorized**: Check if your token is valid and included in the Authorization header.
- **403 Forbidden**: Ensure the authenticated user has the required admin permissions.
- **400 Bad Request**: Verify that the request body is properly formatted and includes all required fields.
- **500 Server Error**: Check the server logs for more details about the error.

## Environment Variables

These endpoints require the following environment variables to be set in your server:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service key (for admin operations)
- `SUPABASE_JWT_SECRET`: Your Supabase JWT secret (for token generation)
- `CLIENT_URL`: Your client application URL (for redirects)
- `AUTH_REDIRECT_URL`: URL to redirect after auth (for magic links and OAuth) 