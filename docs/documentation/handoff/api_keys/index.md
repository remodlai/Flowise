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