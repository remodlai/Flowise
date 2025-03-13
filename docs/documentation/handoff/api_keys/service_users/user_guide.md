# API Key Management User Guide

## Overview

This guide explains how to create, use, and manage API keys in the Remodl AI platform. API keys allow secure programmatic access to the platform's API.

## Types of API Keys

Remodl AI supports two types of API keys:

1. **Personal API Keys**: These keys are tied directly to your user account and inherit your permissions. They are ideal for personal use, testing, and development.

2. **Service API Keys**: These keys are tied to a service user with specific permissions. They are ideal for production applications and integrations.

## Creating API Keys

### Creating a Personal API Key

1. Navigate to your account settings or the API keys section of your application
2. Click the "Create API Key" button
3. Select "Personal Key" from the options
4. Enter a name for your API key (e.g., "Development Key")
5. Select an expiration date (default: 1 year)
6. Click "Create"
7. Copy and securely store the API key that is displayed (it will only be shown once)

### Creating a Service API Key

1. Navigate to your application settings or the API keys section of your application
2. Click the "Create API Key" button
3. Select "Service Key" from the options
4. Enter a name for your API key (e.g., "Production API")
5. Select the permissions you want to grant to this key
   - View-only (default)
   - Read/Write
   - Full Access
   - Custom (select specific permissions)
6. Select an expiration date (default: 1 year)
7. Click "Create"
8. Copy and securely store the API key that is displayed (it will only be shown once)

## Using API Keys

You can use API keys to authenticate API requests in the following ways:

### HTTP Header (Recommended)

Include the API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

Example using curl:

```bash
curl -X GET "https://api.remodl.ai/v1/platform/applications" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Query Parameter

Include the API key as a query parameter:

```
https://api.remodl.ai/v1/platform/applications?api_key=YOUR_API_KEY
```

Example using curl:

```bash
curl -X GET "https://api.remodl.ai/v1/platform/applications?api_key=YOUR_API_KEY"
```

## Managing API Keys

### Viewing API Keys

1. Navigate to your account settings or the API keys section of your application
2. You will see a list of your API keys with the following information:
   - Name
   - Type (Personal or Service)
   - Creation date
   - Expiration date
   - Last used date
   - Status (Active or Inactive)

### Revoking API Keys

If an API key is compromised or no longer needed, you should revoke it:

1. Navigate to your account settings or the API keys section of your application
2. Find the API key you want to revoke
3. Click the "Revoke" button
4. Confirm the revocation

Once revoked, an API key cannot be used again and will not appear in your active API keys list.

### Rotating API Keys

It's a good practice to rotate API keys regularly:

1. Create a new API key with the same permissions
2. Update your applications to use the new API key
3. Revoke the old API key

## Best Practices

### Security

- Keep your API keys secure and do not share them
- Use HTTPS for all API requests
- Store API keys in environment variables or secure configuration files
- Never hardcode API keys in source code
- Revoke API keys that are no longer needed

### Usage

- Use personal keys for testing and development
- Use service keys for production applications
- Use the minimum required permissions for each API key
- Set appropriate expiration dates for API keys
- Monitor API key usage for suspicious activity

## Troubleshooting

### API Key Not Working

If your API key is not working, check the following:

1. Verify that the API key is correct
2. Check if the API key has expired
3. Ensure that the API key has the necessary permissions
4. Verify that the API key is being sent correctly in the request

### Rate Limiting

API requests are subject to rate limiting. If you exceed the rate limit, you will receive a 429 Too Many Requests response. To avoid rate limiting:

1. Implement exponential backoff in your applications
2. Cache responses when appropriate
3. Optimize your API usage to minimize the number of requests

## FAQ

**Q: Can I use the same API key for multiple applications?**

A: Yes, but it's recommended to use separate API keys for different applications to limit the impact if one key is compromised.

**Q: How many API keys can I create?**

A: There is no hard limit on the number of API keys you can create, but it's recommended to keep the number manageable.

**Q: Can I change the permissions of an existing API key?**

A: No, you need to create a new API key with the desired permissions and revoke the old one.

**Q: What happens when an API key expires?**

A: When an API key expires, it can no longer be used to authenticate API requests. You will need to create a new API key.

**Q: Can I see the full API key after it's created?**

A: No, for security reasons, the full API key is only displayed once when it's created. Make sure to copy and securely store it at that time. 