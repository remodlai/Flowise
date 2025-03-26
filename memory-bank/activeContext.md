# Active Context

## CRITICAL INSTRUCTIONS FOR AI ASSISTANT

### Core Behavioral Requirements
1. NEVER make assumptions about implementation or architecture
2. NEVER start making changes without explicit confirmation from Brian
3. ALWAYS ask for clarification when unsure
4. NEVER proceed with actions based on partial understanding
5. NEVER OVERCOMPLICATE THINGS
   - Keep solutions simple and elegant
   - Don't add unnecessary complexity
   - Don't suggest additional work unless explicitly requested
   - If a simple solution exists, use it
   - Don't create extra steps or processes
   - Don't add "nice to have" features without asking
6. FILE LENGTH AND ORGANIZATION
   - NEW files must not exceed ~400 lines
   - Split files when approaching 400 lines for:
     * Better code organization
     * Improved readability
     * Easier maintenance
     * Clearer separation of concerns
   - EXISTING files stay as-is unless specifically tasked with refactoring
   - Don't attempt to split existing files without explicit direction

7. DOCUMENTATION REQUIREMENTS
   - Extensive block comments for all new code
   - Clear parameter documentation with @param tags
   - Usage instructions and examples
   - Document return types and possible errors
   - Note any dependencies or requirements
   - Include references to related functionality

8. DEPRECATION PROCESS
   - First mark as deprecated with @deprecated tag
   - Comment out deprecated code (don't delete)
   - Document why it's deprecated
   - Document what replaces it
   - Test for broken dependencies
   - Only remove after confirming no dependencies
   - Handle any discovered dependencies before removal

### Interaction Requirements
1. At the start of EVERY interaction:
   - Show current task/focus
   - Reference relevant documentation
   - Confirm understanding before proceeding
   - Present clear, specific questions when needed

### Task Management
1. Maintain active task tracking:
   - Update progress.md after each change
   - Update activeContext.md with current focus
   - Document any blockers or dependencies
   - Track decisions and their rationale

2. Before any implementation:
   - Review existing documentation
   - Confirm approach with Brian
   - Document proposed changes
   - Wait for explicit approval

### Documentation Standards
1. Complex Codebase Awareness:
   - Multiple interconnected components
   - Legacy code considerations
   - Multi-tenant architecture
   - Security implications

2. Change Management:
   - Document all changes
   - Update relevant documentation
   - Track progress
   - Note any technical debt

### Tool Usage Requirements
1. Prioritize Direct Documentation:
   - Use provided documentation links first
   - Reference internal documentation before external sources
   - Only use web search when explicitly directed

2. Tool Priority Order:
   - Firecrawl: For accessing specific documentation URLs
   - Sequential Thinking: For complex problem breakdown
   - Brave Search: Only when explicitly needed/approved
   - Additional tools: Only as specifically required for task

3. Documentation Access:
   - Use provided URLs for official documentation
   - Reference internal glossary/documentation first
   - Ask for specific documentation links when needed

4. NO Random Web Searches:
   - Never default to web search
   - Always ask for specific documentation
   - Verify documentation sources with Brian

### Glossary Management
1. Common Nomenclature:
   - Maintain consistent terminology
   - Update glossary with new terms
   - Track legacy vs. current terms
   - Document term relationships

2. Term Categories:
   - Platform Components
   - Authentication/Authorization
   - Integration Points
   - Development Concepts
   - Legacy References

3. Active Maintenance:
   - Update during conversations
   - Document context for terms
   - Note deprecated terminology
   - Track branding changes

<glossary>
[
  "Remodl AI Platform": "The complete platform, formerly known as Flowise",
  "Remodl API Gateway": "Central request handling and authentication layer",
  "Remodl Auth": "Authentication package for platform and application UIs",
  "Platform UI": "Admin interface for Remodl AI Platform",
  "Application UI": "Individual application frontends using Remodl Auth",
  "PKCE Flow": "Proof Key for Code Exchange authentication flow",
  "Gateway Routes": "API endpoints managed by Remodl API Gateway",
  "Platform Routes": "Restricted routes for platform management",
  "Application Routes": "Routes available to individual applications"
]
</glossary>

## Current Development State

### Core Platform (packages/server)
- Built on Flowise core
- Implementing multi-tenant architecture
- Supabase integration for auth/storage
- Neo4j for graph database

### Platform UI (packages/ui)
- React-based admin interface
- Direct gateway integration
- Remodl Auth package integration

### Remodl Auth Package (remodlai-auth)
- PKCE authentication flow
- JWT handling
- Moving towards gateway-centric auth
- Permission handling refactor in progress

### Remodl API Gateway
- Central request routing
- Auth/Authorization handling
- Application/Organization context management
- Implementing granular permissions

## Active Development Areas

1. Authentication:
   - Gateway route integration
   - Permission escalation
   - Resource-level access control

2. Multi-tenant Architecture:
   - Organization management
   - Application isolation
   - Resource sharing

3. Integration Architecture:
   - Webhook implementation
   - Event system design
   - External system integration

4. Naming Convention Updates:
   - Ongoing Flowise to Remodl transition
   - Documentation updates
   - User-facing component priority 