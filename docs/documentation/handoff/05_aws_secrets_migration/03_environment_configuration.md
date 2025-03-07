# Environment Configuration

This document provides detailed information about the environment configuration required for the AWS Secrets to Supabase migration.

## Overview

The migration from AWS Secrets Manager to Supabase requires changes to the environment configuration to support the new secrets management system. This document outlines the required environment variables, their purpose, and how to configure them.

## Required Environment Variables

### Supabase Configuration

These variables are required for connecting to Supabase:

```
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

- `SUPABASE_URL`: The URL of your Supabase project. This is used to connect to the Supabase API.
- `SUPABASE_KEY`: The service role key for your Supabase project. This is used for server-side operations.
- `SUPABASE_JWT_SECRET`: The JWT secret for your Supabase project. This is used to verify JWT tokens.

### Secrets Management Configuration

These variables control how secrets are managed:

```
# Secrets Management
SECRETS_STORAGE_TYPE=supabase  # Options: json, db, aws, supabase
FLOWISE_SECRETKEY_OVERWRITE=your-master-encryption-key
```

- `SECRETS_STORAGE_TYPE`: Specifies where secrets are stored. Set to `supabase` to use Supabase for secrets management.
- `FLOWISE_SECRETKEY_OVERWRITE`: The master encryption key used to encrypt and decrypt secrets. This should be a strong, random string.

### API Key Configuration

These variables control how API keys are managed:

```
# API Key Configuration
APIKEY_STORAGE_TYPE=supabase  # Options: json, db, supabase
```

- `APIKEY_STORAGE_TYPE`: Specifies where API keys are stored. Set to `supabase` to use Supabase for API key management.

### Credential Configuration

These variables control how credentials are managed:

```
# Credential Configuration
CREDENTIAL_STORAGE_TYPE=supabase  # Options: json, db, aws, supabase
```

- `CREDENTIAL_STORAGE_TYPE`: Specifies where credentials are stored. Set to `supabase` to use Supabase for credential management.

## Configuration Examples

### Development Environment

```
# Supabase Configuration
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-dev-jwt-secret

# Secrets Management
SECRETS_STORAGE_TYPE=supabase
FLOWISE_SECRETKEY_OVERWRITE=dev-master-encryption-key

# API Key Configuration
APIKEY_STORAGE_TYPE=supabase

# Credential Configuration
CREDENTIAL_STORAGE_TYPE=supabase
```

### Production Environment

```
# Supabase Configuration
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-prod-jwt-secret

# Secrets Management
SECRETS_STORAGE_TYPE=supabase
FLOWISE_SECRETKEY_OVERWRITE=prod-master-encryption-key

# API Key Configuration
APIKEY_STORAGE_TYPE=supabase

# Credential Configuration
CREDENTIAL_STORAGE_TYPE=supabase
```

## Transitional Configuration

During the migration process, you may need to use a transitional configuration that supports both the old and new secrets management systems:

```
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Secrets Management
SECRETS_STORAGE_TYPE=supabase
FLOWISE_SECRETKEY_OVERWRITE=your-master-encryption-key

# API Key Configuration
APIKEY_STORAGE_TYPE=json  # or db, depending on your current setup

# Credential Configuration
CREDENTIAL_STORAGE_TYPE=aws  # or json, db, depending on your current setup

# AWS Configuration (for fallback)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

This configuration allows you to gradually migrate secrets to Supabase while still supporting the old storage methods.

## Environment Variable Precedence

The system checks for environment variables in the following order:

1. Environment variables set in the process environment
2. Environment variables set in a `.env` file in the project root
3. Default values hardcoded in the application

## Securing Environment Variables

It's important to keep your environment variables secure, especially in production environments:

1. Never commit environment variables to version control
2. Use a secure method to manage environment variables in production (e.g., AWS Parameter Store, Kubernetes Secrets)
3. Rotate the master encryption key periodically
4. Use different environment variables for different environments (development, staging, production)

## Troubleshooting

If you encounter issues with the environment configuration, check the following:

1. Ensure all required environment variables are set
2. Verify that the Supabase URL and key are correct
3. Check that the master encryption key is consistent across all instances
4. Ensure the JWT secret matches the one configured in Supabase

## Migration Steps

When migrating from AWS Secrets Manager to Supabase, follow these steps to update your environment configuration:

1. Add the Supabase configuration variables:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   ```

2. Run the migration scripts with the transitional configuration.

3. Once the migration is complete, update the storage type variables:
   ```
   SECRETS_STORAGE_TYPE=supabase
   APIKEY_STORAGE_TYPE=supabase
   CREDENTIAL_STORAGE_TYPE=supabase
   ```

4. Remove the AWS configuration variables if they are no longer needed.

## Conclusion

Proper environment configuration is essential for a successful migration from AWS Secrets Manager to Supabase. By following the guidelines in this document, you can ensure a smooth transition to the new secrets management system. 