# Project Brief: Remodl AI Platform

## 1. Overview

The Remodl AI Platform is a Software-as-a-Service (SaaS) platform built on top of a forked and customized version of the open-source Flowise AI visual builder. The platform aims to provide a robust environment for creating, managing, and deploying AI-powered applications and agents, with a strong emphasis on multi-tenancy, user management, and application-specific feature sets.

The core Flowise AI engine (currently targeting version 2.2.8 via the `FlowiseAI/Flowise` upstream main branch) will be used for its visual flow-building capabilities, particularly leveraging its new Agent Flow V2 architecture for enhanced streaming and agentic functionalities.

## 2. Core Objectives

*   **Multi-Tenancy:** Enable distinct "Organizations" (tenants) to operate securely and independently within the platform.
*   **Multi-Application:** Allow the creation and management of multiple distinct "Applications." Each Application can be a standalone SaaS offering or an enterprise custom build. An Organization belongs to only one Application.
*   **Feature Management:** Provide a mechanism to enable/disable specific "Features" for each Application, allowing for tailored functionality.
*   **Custom User Interface:** Develop a unique platform UI (`packages/remodl-ui` within the Flowise monorepo) that provides the Remodl AI Platform experience, including dashboards, Application/Organization management, and user administration, while integrating the core Flowise flow-building canvas.
*   **Decoupled Business Logic:** Utilize Supabase as the primary backend for managing platform-level business logic (Applications, Organizations, Users, Features, and their relationships with Flowise assets).
*   **API Gateway:** Employ Zuplo as an API gateway to manage and federate API endpoints, providing a unified interface for the frontend and external services, and routing requests to Flowise, Supabase, or other platform microservices.
*   **Minimize Core Flowise Changes:** Leverage upstream Flowise capabilities (especially Agent Flow V2) to reduce the need for deep modifications to the core Flowise codebase, focusing instead on extending Flowise via custom nodes and a well-defined API layer.
*   **Extensibility:** Allow for the creation of custom Flowise nodes within `packages/components` to interact with the Supabase backend and other platform services.

## 3. Key Architectural Components

*   **Flowise Fork (`Flowise/` directory):** The customized version of Flowise.
    *   `packages/ui` (to be renamed or heavily customized, e.g., `packages/remodl-ui`): The primary platform frontend.
    *   `packages/components`: For shared logic and custom Flowise nodes.
    *   `packages/server`: Core Flowise backend, to be kept as close to upstream as possible.
*   **Supabase:** Backend for platform business logic, user management, multi-tenancy data, and application configurations.
*   **Zuplo:** API Gateway for routing, authentication, and request/response transformation.
*   **`Flowise-Upstream/` directory:** A local clone of the official `FlowiseAI/Flowise` repository for reference.

## 4. Current Strategic Decision (as of [Current Date])

The project is pivoting to a "start fresh" approach for integrating custom platform features. This involves:
*   Creating a new base branch (`remodel-v2-base`) in the `Flowise` fork, directly from `FlowiseAI/Flowise` main (version 2.2.8).
*   Duplicating the standard `packages/ui` into a new package (e.g., `packages/remodl-ui`) where primary custom UI development will occur. The original `packages/ui` will be kept closer to upstream.
*   Selectively porting essential UI customizations and custom Flowise nodes to this new clean base, rather than merging an older feature branch with extensive (now potentially redundant) core modifications.
*   This decision is driven by the advancements in Flowise (Agent Flow V2, improved streaming, robust MCP) which reduce the need for previous custom core code changes.
