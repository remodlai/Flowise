# Supabase Storage Integration Plan

## Overview

This document outlines the comprehensive plan for integrating Supabase Storage across the Remodl AI platform. The integration aims to provide a unified, secure, and scalable solution for file and image storage, replacing the current mix of base64 encoding and legacy storage methods.

## Current State

The platform currently uses a mix of storage approaches:

1. **Supabase Storage** (`supabaseStorage.ts`): Partially implemented with multi-tenant support and bucket management.
2. **Legacy Storage** (`storageUtils.ts`): Uses AWS S3 or local filesystem without multi-tenant organization.
3. **Multi-Modal Utils** (`multiModalUtils.ts`): Falls back to base64 encoding for images, causing truncation issues.
4. **Supabase Storage Setup** (`setupSupabaseStorage.ts`): Handles bucket creation and policy setup.

## Key Issues

1. **Mixed Storage Systems**: Inconsistent use of storage systems across the platform.
2. **Base64 Truncation**: Images larger than 200px by 200px get truncated when using base64 encoding.
3. **Incomplete Migration**: Partial migration to Supabase Storage with legacy code still in use.
4. **Multi-tenant Awareness**: Not all storage operations respect the multi-tenant architecture.

## Implementation Plan

### Phase 1: Core Storage Infrastructure (Week 1)

#### 1.1 Standardize Storage Path Generation
- Enhance `supabaseStorage.ts` to support all path patterns:
  - Platform-level: `/platform/{resource_type}/{resource_id}`
  - Application-level: `/applications/{app_id}/{resource_type}/{resource_id}`
  - Organization-level: `/organizations/{org_id}/{resource_type}/{resource_id}`
  - User-level: `/users/{user_id}/{resource_type}/{resource_id}`
- Create consistent naming conventions for buckets and paths

#### 1.2 Complete API Wrapper
- Expand `supabaseStorage.ts` with comprehensive methods:
  - `uploadFile`: Generic file upload with proper path generation
  - `uploadImage`: Image-specific upload with transformation options
  - `getFileUrl`: Generate public/private URLs with optional transformations
  - `listFiles`: List files with filtering options
  - `deleteFile`: Remove files with proper permission checks
  - `copyFile`: Copy files between paths/buckets
- Ensure proper error handling and multi-tenant isolation

#### 1.3 Update Multi-Modal Utils
- Replace base64 fallback in `multiModalUtils.ts` with Supabase Storage
- Implement proper URL generation for LLM consumption
- Add support for various image formats and sizes

### Phase 2: API Endpoints (Week 2)

#### 2.1 Create Base File API Controller
- Create `FileController.ts` with endpoints:
  - `POST /api/v1/files`: Upload files
  - `GET /api/v1/files`: List files
  - `GET /api/v1/files/:id`: Get file details
  - `DELETE /api/v1/files/:id`: Delete files
- Add authentication and authorization middleware
- Implement proper validation for file uploads

#### 2.2 Create Image-Specific Endpoints
- Create `ImageController.ts` with endpoints:
  - `POST /api/v1/files/images`: Upload images with transformation options
  - `GET /api/v1/files/images`: List images
  - `GET /api/v1/files/images/:id`: Get image with transformation parameters
  - `DELETE /api/v1/files/images/:id`: Delete images
- Add image-specific validation and processing
- Implement transformation query parameters

#### 2.3 Update Routes Configuration
- Update `api.ts` to include new file and image routes
- Ensure proper middleware application for authentication and tenant isolation

### Phase 3: Migration from Legacy Storage (Week 3)

#### 3.1 Deprecate Legacy StorageUtils
- Create migration functions from old storage to Supabase
- Update all references to use new API
- Add deprecation warnings to legacy functions

#### 3.2 Update Prediction Endpoint
- Modify `/predictions` endpoint to use Supabase Storage for attached files
- Ensure proper URL generation for LLM consumption
- Add support for various file types

#### 3.3 Create Migration Script
- Develop script to migrate existing files from legacy storage to Supabase
- Implement validation and verification steps
- Create rollback mechanism

### Phase 4: Advanced Features (Week 4)

#### 4.1 File Chooser Component
- Build UI component for browsing/selecting previously uploaded files
- Implement search and filtering capabilities
- Add preview functionality for different file types

#### 4.2 Webhook Integration
- Create endpoint for receiving external image URLs
- Implement fetching and storing in appropriate bucket
- Add validation and security checks

#### 4.3 Transformation Pipeline
- Add support for image optimization and resizing
- Implement caching for transformed images
- Add support for format conversion

## Use Cases Implementation

### 1. User Upload During Session
- Integrate with chat interface to handle file uploads
- Store in user or organization bucket based on context
- Return transformed URLs for images to be used in LLM context

### 2. Document Store Uploads
- Enhance document store to use Supabase Storage
- Implement proper indexing and metadata storage
- Add support for document preview

### 3. File Integrations with External Tools
- Create standardized API for external tool integration
- Implement webhook for receiving files from external sources
- Add support for various authentication methods

### 4. Application-Level Files
- Implement storage for application-specific resources
- Add proper access control based on application roles
- Create management interface for application owners

### 5. Platform-Level Files
- Set up dedicated storage for platform-wide resources
- Implement proper versioning and access control
- Create admin interface for managing platform resources

### 6. Organization-Level Uploads
- Create organization-specific upload endpoints
- Implement proper quota management
- Add organization admin interface for file management

### 7. User Profile Image Uploads
- Enhance user profile to use Supabase Storage for avatars
- Implement image cropping and resizing
- Add support for default avatars

### 8. External Image URL Webhook
- Create webhook endpoint for receiving image URLs
- Implement fetching, validation, and storage
- Add support for various authentication methods

## Security Considerations

### Access Control
- Implement proper Row-Level Security (RLS) policies
- Ensure tenant isolation at all levels
- Add proper role-based access control

### File Validation
- Implement file type validation
- Add virus scanning for uploaded files
- Set appropriate file size limits

### URL Security
- Use signed URLs for private files
- Implement proper expiration for temporary URLs
- Add referrer checking for public URLs

## Testing Strategy

### Unit Tests
- Test all storage utility functions
- Validate path generation logic
- Ensure proper error handling

### Integration Tests
- Test API endpoints with various file types
- Validate multi-tenant isolation
- Test transformation pipeline

### End-to-End Tests
- Test file upload and retrieval flow
- Validate webhook integration
- Test migration from legacy storage

## Monitoring and Maintenance

### Usage Monitoring
- Implement storage usage tracking
- Set up alerts for quota limits
- Monitor transformation usage

### Performance Monitoring
- Track upload and download speeds
- Monitor transformation performance
- Identify bottlenecks

### Maintenance Tasks
- Implement cleanup for temporary files
- Set up regular validation of storage integrity
- Create backup and restore procedures

## Key Files

- `packages/server/src/utils/supabaseStorage.ts`: Main Supabase Storage utility
- `packages/server/src/utils/multiModalUtils.ts`: Multi-modal message handling
- `packages/server/src/utils/storageUtils.ts`: Legacy storage utilities
- `packages/server/src/utils/setupSupabaseStorage.ts`: Storage initialization
- `packages/server/src/controllers/FileController.ts`: File API endpoints
- `packages/server/src/controllers/ImageController.ts`: Image API endpoints
- `packages/ui/src/components/FileChooser`: UI components for file selection

## Conclusion

This comprehensive plan outlines the steps needed to fully integrate Supabase Storage across the Remodl AI platform. By following this plan, we will create a unified, secure, and scalable solution for file and image storage, addressing the current issues with mixed storage systems and base64 truncation. 