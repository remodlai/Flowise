# Organization Logo Implementation Plan

## Overview

This document outlines the plan for implementing organization logo functionality similar to the application logo functionality. The implementation will follow the same pattern and include the same workaround for file metadata until the service users feature is implemented.

## Implementation Steps

1. **Create Organization Logo Routes**
   - Add a route to get an organization's logo URL: `GET /api/v1/organizations/:orgId/assets/logo/url`
   - Add a route to upload an organization logo: `POST /api/v1/organizations/:orgId/assets/logo/upload`

2. **Implement Controller Methods**
   - Create `getOrganizationLogoUrl` method in `OrganizationController`
   - Create `uploadOrganizationLogo` method in `OrganizationController`
   - Follow the same pattern as the application logo methods, including the workaround for file metadata

3. **Storage Structure**
   - Store organization logos in the `organizations` bucket
   - Use the path pattern: `{snake_case_org_name}/assets/logos/{filename}`

4. **Database Updates**
   - Add a `logo_url` field to the `organizations` table if it doesn't already exist
   - Update the organization record with the logo URL after upload

5. **Documentation**
   - Create documentation for organization logo routes
   - Update the organization routes changelog

## Implementation Details

### Storage Path

The organization logo will be stored in Supabase Storage with the following path:
```
organizations/{snake_case_org_name}/assets/logos/{filename}
```

### File Metadata

Similar to the application logo implementation, the system will:
- Attempt to save file metadata to the `files` table if a valid user ID is present
- Continue with updating the organization's `logo_url` field even if file metadata cannot be saved
- Return appropriate success/warning messages based on the outcome

### Permissions

The upload functionality will require the `image.create` permission, consistent with the application logo implementation.

## Code Example

The implementation will be similar to the application logo functionality, with appropriate adjustments for organizations:

```typescript
static async uploadOrganizationLogo(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    
    // Check permissions, validate file, etc.
    
    // Upload to Supabase Storage
    const path = caseMaker.toSnakeCase(orgName) + '/assets/logos/' + normalizedName;
    const bucket = 'organizations';
    
    // Get public URL
    
    // Try to save file metadata if user ID is present
    const userId = req.user?.userId;
    if (userId) {
      // Attempt to save metadata, but continue even if it fails
    }
    
    // Update organization logo_url
    await app.Supabase
      .from('organizations')
      .update({ logo_url: url })
      .eq('id', orgId);
    
    // Return appropriate response
  } catch (error) {
    // Handle errors
  }
}
```

## Future Considerations

1. **Service Users**: Once service users are implemented, update both application and organization logo functionality to use service users for file metadata.
2. **Image Transformations**: Consider adding support for image transformations for both application and organization logos.
3. **Default Logos**: Implement default logos for applications and organizations that don't have custom logos.
4. **Logo Validation**: Add more robust validation for logo files, including dimensions, file size, etc. 