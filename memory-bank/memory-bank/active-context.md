# Current Context

## Ongoing Tasks
- **Server API Understanding & Documentation (Highest Priority):**
    - Systematically review all route definitions in `packages/server/src/routes/`.
    - Document the structure, purpose, expected request/response schemas, and any associated controller/service logic for each API endpoint.
    - This internal documentation is crucial before proceeding with UI architecture decisions or implementation.
- **Strategic Refoundation (Secondary Focus, pending API documentation):**
    - Base branch `remodel-v2-base` (from FlowiseAI/Flowise main v2.2.8) is created and ready.
    - Plan for potential duplication of `packages/ui` into `packages/remodl-ui` (or similar) for custom platform UI, to be executed *after* server API documentation is complete.
- **Platform Feature Development (Post-Refoundation & API Doc):**
    - Define/implement custom Flowise nodes in `packages/components` for Supabase integration.
    - Develop platform UI in the designated UI package.
    - Configure Zuplo API Gateway.

## Known Issues
- None specific to the new `remodel-v2-base` branch yet.
- Previously identified "gotchas" in Flowise core (e.g., base64 image uploads) will be addressed by architectural choices (e.g., pre-processing via Supabase, Zuplo transformations) rather than deep core modifications.

## Next Steps (Immediate)
1.  **Begin detailed review and documentation of `packages/server/src/routes/` and their corresponding controllers/services.**
2.  Identify key API endpoints that will be consumed by the Remodl AI Platform UI (via Zuplo).
3.  Once server APIs are well-understood and documented, revisit the UI strategy:
    *   Confirm the exact name for the new custom UI package directory.
    *   Plan modifications to monorepo configuration files.
    *   Plan the duplication/creation of the custom UI package.

## Current Session Notes

- [11:37:30 AM] [Unknown User] File Update: Updated active-context.md
- Prioritized full documentation of server routes before making UI architectural changes or duplicating UI packages.
- Decision made to "start fresh" on a new branch (`remodel-v2-base`) based on upstream Flowise v2.2.8.
- The Remodl AI Platform will feature a multi-application, multi-tenant architecture with business logic managed in Supabase and API orchestration via Zuplo.
- Custom UI development will likely occur in a duplicated, dedicated UI package.
- The `Flowise` directory is the fork; `Flowise-Upstream` is a reference clone. Git operations are in `Flowise`.
- Memory Bank path: `/Users/brianbagdasarian/projects/Flowise/memory-bank/memory-bank/memory-bank`.
- Documented the Flowise monorepo build & serve pattern in `system-patterns.md`.
- Confirmed the role of `packages/api-documentation` as relating to public API docs.
