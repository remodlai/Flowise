# AWS Secrets to Supabase Migration Documentation

## Overview

This documentation outlines the plan to migrate from AWS Secrets Manager to Supabase for secrets management in the Remodl AI platform. The migration will unify our authentication and secrets management systems, simplify the architecture, and provide consistent access control across environments.

## Contents

1. [Migration Plan](01_migration_plan.md)
   - Current state and target state
   - Migration checklist with phases
   - Detailed implementation plan
   - Environment variables and testing strategy

2. [Technical Implementation](02_technical_implementation.md)
   - Database schema and RLS policies
   - Secrets Service implementation
   - API Key Service integration
   - Credential management integration
   - Migration scripts and testing

3. [Benefits and Rationale](03_benefits_and_rationale.md)
   - Current challenges
   - Benefits of migration
   - Why Supabase is the right choice
   - Migration approach and rollback plan

## Key Objectives

1. **Unify Authentication and Secrets Management**: Create a single, unified system for both authentication and secrets management using Supabase.

2. **Simplify Architecture**: Eliminate the need for multiple storage mechanisms (JSON, database, AWS Secrets Manager) and use Supabase for all secrets.

3. **Improve Security**: Implement consistent encryption and access control through Supabase Row-Level Security (RLS) policies.

4. **Ensure Backward Compatibility**: Maintain the same API for API keys and credentials to avoid breaking changes for clients.

5. **Provide Consistent Environment Configuration**: Use the same approach in all environments (development, staging, production).

## Migration Phases

The migration will be implemented in the following phases:

### Phase 1: Setup and Preparation
- Create the `secrets` table in Supabase
- Implement RLS policies for the `secrets` table
- Create the Secrets Service for managing secrets in Supabase
- Update environment variables configuration

### Phase 2: API Key Migration
- Update the API Key Service to use Supabase
- Update API Key validation functions
- Create a migration script for existing API keys
- Test API Key CRUD operations with Supabase
- Test API Key validation with existing endpoints

### Phase 3: Credential Migration
- Update credential encryption/decryption functions
- Create a migration script for existing credentials
- Test credential CRUD operations with Supabase
- Test credential usage in chatflows

### Phase 4: Testing and Validation
- Comprehensive testing in development environment
- Verify all API endpoints work with the new secrets management
- Verify chatflows can access credentials properly
- Performance testing for Supabase secrets retrieval

### Phase 5: Cleanup
- Remove AWS Secrets Manager code
- Remove local file-based secrets storage code
- Update documentation
- Remove unused environment variables

## Getting Started

To implement this migration, follow these steps:

1. Read the [Migration Plan](01_migration_plan.md) to understand the overall approach.
2. Review the [Technical Implementation](02_technical_implementation.md) for detailed implementation instructions.
3. Understand the [Benefits and Rationale](03_benefits_and_rationale.md) to appreciate why this migration is important.
4. Follow the migration phases in order, completing each phase before moving to the next.
5. Test thoroughly after each phase to ensure everything works as expected.

## Timeline

The estimated timeline for the migration is 8-12 days:

1. **Phase 1 (Setup)**: 1-2 days
2. **Phase 2 (API Key Migration)**: 2-3 days
3. **Phase 3 (Credential Migration)**: 2-3 days
4. **Phase 4 (Testing)**: 2-3 days
5. **Phase 5 (Cleanup)**: 1 day 