# API Keys Documentation

This directory contains documentation related to API keys in the Remodl AI platform.

## Contents

### Service Users

The service users implementation provides a secure way to associate API keys with specific applications and permissions.

- [Implementation Plan](./service_users/implementation_plan.md) - Comprehensive plan for implementing application service users and API keys

## Overview

API keys in Remodl AI provide a secure way for applications to authenticate with the platform API. Each API key is associated with a specific service user that has defined permissions.

### Key Concepts

- **Service Users**: Special user accounts created specifically for API access
- **API Keys**: Secure tokens that authenticate API requests
- **Permissions**: Granular access controls that define what actions an API key can perform
- **Scopes**: Limitations on which endpoints an API key can access

### Security Considerations

- API keys are securely stored (hashed in the database)
- API keys have an expiration date
- API keys are revocable
- Service users follow the principle of least privilege
- All API key operations are logged for audit purposes 

## High-Performance Authentication

To support high-volume API usage, the platform implements a Redis-based caching layer for API key authentication:

### Redis Caching Architecture

- **Key Format**: `apikey:{api_key_hash}`
- **Value Structure**:
  ```json
  {
    "jwt": "raw_jwt_token",
    "decoded_jwt": {
      "sub": "user_id",
      "user_roles": [...],
      "is_platform_admin": boolean,
      "exp": timestamp
    },
    "expires": timestamp,
    "user_id": "user_id",
    "is_service_account": boolean
  }
  ```
- **TTL**: Automatically set to match JWT expiration

### Authentication Flow

1. Extract API key from request (Authorization header)
2. Look up API key in Redis cache
   - If found and not expired, use stored JWT and decoded data
   - If not found or expired:
     - Look up API key in Supabase
     - If valid, generate new JWT
     - Decode JWT and store both raw and decoded JWT in Redis
     - Set TTL to match JWT expiration
3. Use JWT for authentication and decoded data for authorization checks

### Performance Benefits

- Minimizes database queries for frequently used API keys
- Reduces latency for API key validation
- Scales to support thousands of concurrent API requests
- Maintains security by respecting token expiration
- Synchronizes with Supabase for consistency

### Implementation Notes

- Uses Upstash Redis for serverless, high-performance caching
- Automatically handles token refresh when expired
- Maintains compatibility with existing Supabase authentication
- Provides graceful fallback to database if Redis is unavailable 