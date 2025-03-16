# API Keys Documentation

This directory contains documentation related to API keys in the Remodl AI platform.

## Contents

### Service Users

The service users implementation provides a secure way to associate API keys with specific applications and permissions.

- [Implementation Plan](./service_users/implementation_plan.md) - Comprehensive plan for implementing application service users and API keys
- [Authentication Flow](./service_users/authentication_flow.md) - Detailed explanation of the API key authentication flow with Zuplo API Gateway

## Overview

API keys in Remodl AI provide a secure way for applications to authenticate with the platform API. Each API key is associated with a specific service user that has defined permissions.

## Centralized Traffic Management with Zuplo API Gateway

Remodl AI uses Zuplo API Gateway (api.remodl.ai) as the central entry point for **ALL** traffic in the platform, including:

- UI to React Server communications
- React Server to Platform backend communications
- External API calls to the platform
- Platform calls to external services (when proxied)

This centralized approach provides complete control over every endpoint, resource, and communication path in the system.

### Architecture Benefits

- **Edge Deployment**: Zuplo runs in over 200 data centers worldwide, providing low-latency access globally
- **Unified Traffic Control**: All requests flow through a single point where consistent policies can be applied
- **Interception Capabilities**: Custom code can be executed between any communication path
- **Secure Tunneling**: Private backends can connect to Zuplo via outbound connections, eliminating the need for public exposure

### Traffic Flow Control

Zuplo enables sophisticated traffic management through:

1. **URL Forwarding**: Proxy requests to different backends based on route configuration
2. **Path Rewriting**: Modify request paths before forwarding to backends
3. **Protocol Translation**: Convert between different formats (JSON, XML, etc.)
4. **Circuit Breaking**: Prevent cascading failures by detecting and handling service outages
5. **Custom Middleware**: Execute custom code at any point in the request/response lifecycle

### Authentication & Authorization

- **Built-in Authentication**: Zuplo's API Key Authentication policy handles validation of API keys
- **Multiple Auth Methods**: Supports both JWT (from Supabase) and API key authentication simultaneously
- **Consumer Management**: Stores consumer metadata including permissions and roles
- **Claim-Based Authorization**: Validates JWT claims for permission checks at the gateway level

### Request Flow

1. Client sends request to Zuplo API Gateway (api.remodl.ai)
2. Zuplo validates authentication (API key or JWT)
3. Zuplo applies policies (rate limiting, permission checks, etc.)
4. If valid, Zuplo forwards the request to the appropriate backend with added context
5. Backend processes the request and returns a response
6. Zuplo applies outbound policies and returns the response to the client

### Security Benefits

- **Complete Traffic Control**: Every request, regardless of source or destination, is subject to the same security policies
- **Backend Protection**: Backend services are not directly exposed to the internet
- **Consistent Policy Enforcement**: Authentication, rate limiting, and other policies applied uniformly
- **Separation of Concerns**: Authentication and authorization handled at the gateway level, simplifying backend services

## JWT Authentication and Claim Checks

Zuplo also handles JWT authentication from Supabase Auth:

- **Supabase JWT Policy**: Validates JWTs using Supabase's JWT secret
- **Claim Validation**: Supports required claims validation (e.g., requiring specific roles)
- **User Context**: Makes JWT claims available in the request context for authorization decisions
- **Custom Claims**: Handles custom claims for specialized access control

### Custom Authorization Policies

Zuplo allows for custom TypeScript policies for complex authorization logic:

```typescript
// Example custom policy for role-based access control
export default async function customRolePolicy(request, context, options) {
  // Get user data from the request context
  const user = request.user;
  
  if (!user) {
    return new Response("Authentication required", { status: 401 });
  }
  
  // Check if user has the required role
  if (user.data.roles.includes(options.role)) {
    return request;
  }
  
  return new Response("Access denied", { status: 403 });
}
```

## Implementation Details

- Supabase Auth continues to handle user authentication and JWT generation
- Zuplo validates both JWTs and API keys at the gateway level
- API keys are associated with service users in Supabase
- Zuplo policies enforce permissions based on JWT claims or API key associations
- All external UIs, including the platform UI, connect through the Zuplo gateway

## Security Considerations

- API keys are securely stored (hashed in the database)
- API keys have an expiration date
- API keys are revocable
- Service users follow the principle of least privilege
- All API key operations are logged for audit purposes
- Backend services only accept requests from the Zuplo gateway
- Zuplo applies rate limiting and other protections against abuse

## Additional Features

- **Rate Limiting**: Configurable rate limits based on API key or user
- **Request Validation**: Validates request format before reaching backend services
- **Response Transformation**: Can modify responses for versioning or formatting
- **Analytics**: Detailed usage metrics for API calls
- **Developer Portal**: Self-service API key management through Zuplo's developer portal
- **Custom Policies**: TypeScript-based custom policies for complex authorization logic
- **Monitoring & Logging**: Centralized logging of all API traffic for debugging and analytics 