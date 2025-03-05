# Application Management Implementation Plan

## Phase 1: Database and API Setup

### 1.1 Database Schema
- Create `applications` table with fields:
  - id (UUID)
  - name (TEXT)
  - description (TEXT)
  - logo_url (TEXT)
  - website (TEXT)
  - version (TEXT)
  - type (TEXT)
  - status (TEXT)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

- Create `application_organizations` junction table:
  - application_id (UUID, FK)
  - organization_id (UUID, FK)
  - created_at (TIMESTAMPTZ)

- Create `application_settings` table:
  - application_id (UUID, FK)
  - resource_limits (JSONB)
  - features (JSONB)
  - enabled_models (JSONB)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

### 1.2 API Endpoints
- Implement GET `/api/applications` endpoint
- Implement GET `/api/applications/:id` endpoint
- Implement POST `/api/applications` endpoint
- Implement PUT `/api/applications/:id` endpoint
- Implement DELETE `/api/applications/:id` endpoint
- Implement GET `/api/applications/:id/organizations` endpoint
- Implement POST `/api/applications/:id/organizations` endpoint
- Implement DELETE `/api/applications/:id/organizations/:orgId` endpoint

### 1.3 Supabase Storage Setup
- Create storage bucket for application assets
- Set up access policies for application assets
- Create helper functions for generating storage paths

## Phase 2: Authentication Context Integration

### 2.1 JWT Custom Claims
- Modify auth hooks to include application context in JWT
- Create server function to update application context in JWT
- Implement middleware to extract application context from JWT

### 2.2 Application Context Management
- Create Redux slice for application context
- Implement functions to update JWT when switching applications
- Add local storage fallback for application context

## Phase 3: UI Implementation - List View

### 3.1 Application Card Component
- Create `ApplicationCard` component with:
  - Logo/icon display
  - Name and description
  - Key metrics (orgs, users, flows)
  - Status indicator
  - Action buttons

### 3.2 Application List Grid
- Implement grid layout for application cards
- Add search and filter functionality
- Implement loading states and empty states
- Connect to API endpoints for data fetching

### 3.3 Application Creation Dialog
- Enhance dialog with additional fields:
  - Logo upload
  - Website URL
  - Version number
  - Type selection
- Add form validation
- Connect to API for creation

## Phase 4: UI Implementation - Detail View

### 4.1 Application Dashboard Layout
- Create layout with header and tabbed sections
- Implement navigation between sections
- Add breadcrumb navigation

### 4.2 Overview Section
- Create metrics cards for key statistics
- Implement usage charts
- Add activity timeline component

### 4.3 Organizations Section
- Create organization list component
- Implement organization assignment functionality
- Add organization creation within application

### 4.4 Users Section
- Create user list filtered by application
- Implement role assignment within application
- Add user invitation functionality

### 4.5 Resources Section
- Create components for chatflows, agentflows, etc.
- Implement resource usage visualization
- Add resource management controls

### 4.6 Settings Section
- Create form for application settings
- Implement feature toggles
- Add resource limits configuration

## Phase 5: Application Selector

### 5.1 Header Component
- Create application selector dropdown
- Implement global view toggle
- Connect to application context management

### 5.2 Application Switching
- Implement JWT update on application switch
- Add loading states during context switch
- Handle permissions during application switch

## Phase 6: Testing and Refinement

### 6.1 Unit Testing
- Write tests for API endpoints
- Write tests for UI components
- Write tests for context management

### 6.2 Integration Testing
- Test application creation flow
- Test organization assignment
- Test application switching
- Test permission enforcement

### 6.3 UI Refinement
- Improve responsive behavior
- Enhance animations and transitions
- Optimize performance
- Ensure accessibility compliance

## Phase 7: Documentation and Deployment

### 7.1 User Documentation
- Create user guide for application management
- Document application settings and features
- Create tutorials for common workflows

### 7.2 Developer Documentation
- Document API endpoints
- Document database schema
- Document context management approach

### 7.3 Deployment
- Deploy database changes
- Deploy API endpoints
- Deploy UI changes
- Monitor for issues

## Timeline Estimate

- Phase 1: 3-4 days
- Phase 2: 2-3 days
- Phase 3: 3-4 days
- Phase 4: 5-7 days
- Phase 5: 2-3 days
- Phase 6: 3-4 days
- Phase 7: 2-3 days

Total estimated time: 20-28 days 