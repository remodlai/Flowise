# Project Brief: Remodl AI Platform

## 1. Overview

The Remodl AI Platform is a Software-as-a-Service (SaaS) platform built using a customized version of the open-source **Remodl Core** visual builder (which itself is initially based on Flowise AI). The platform aims to provide a robust environment for creating, managing, and deploying AI-powered applications and agents, with a strong emphasis on multi-tenancy, user management, and application-specific feature sets.

The **Remodl Core** (currently targeting underlying Flowise v2.2.8 via the `FlowiseAI/Flowise` upstream main branch, on our `remodel-v2-base` branch) will be used for its visual flow-building capabilities, particularly leveraging its Agent Flow V2 architecture for enhanced streaming and agentic functionalities.

## 2. Core Objectives

*   **Multi-Tenancy:** Enable distinct "Organizations" (tenants) to operate securely and independently within the platform.
*   **Multi-Application:** Allow the creation and management of multiple distinct "Applications." Each Application can be a standalone SaaS offering or an enterprise custom build. An Organization belongs to only one Application.
*   **Feature Management:** Provide a mechanism to enable/disable specific "Features" for each Application, allowing for tailored functionality.
*   **Custom User Interface:** Develop a unique platform UI (`packages/remodl-ui` within the **Remodl Core** monorepo) that provides the Remodl AI Platform experience, including dashboards, Application/Organization management, and user administration, while integrating the core **Remodl Core** flow-building canvas.
*   **Decoupled Business Logic:** Utilize Supabase as the primary backend for managing platform-level business logic (Applications, Organizations, Users, Features, and their relationships with **Remodl Core** assets).
*   **API Gateway:** Employ Zuplo as an API gateway to manage and federate API endpoints, providing a unified interface for the frontend and external services, and routing requests to **Remodl Core**, Supabase, or other platform microservices.
*   **Minimize Core Changes to Remodl Core:** Leverage upstream **Remodl Core** capabilities (especially Agent Flow V2) to reduce the need for deep modifications to the **Remodl Core** codebase, focusing instead on extending it via custom nodes and a well-defined API layer.
*   **Extensibility:** Allow for the creation of custom **Remodl Core** nodes within `packages/components` to interact with the Supabase backend and other platform services.

## 3. Key Architectural Components

*   **Remodl Core Base (`Flowise/` directory):** The customized codebase for the **Remodl Core** engine.
    *   `packages/ui` (original UI, to be duplicated into `packages/remodl-ui`): Reference and potential base for the core canvas.
    *   `packages/remodl-ui` (to be created): The primary Remodl AI Platform frontend.
    *   `packages/components`: For shared logic and custom **Remodl Core** nodes.
    *   `packages/server`: The **Remodl Core** backend, to be kept as close to upstream as possible.
*   **Supabase:** Backend for Remodl AI Platform business logic, user management, multi-tenancy data, and application configurations.
*   **Zuplo:** API Gateway for routing, authentication, and request/response transformation.
*   **`Flowise-Upstream/` directory:** A local clone of the official `FlowiseAI/Flowise` repository for reference (the origin of **Remodl Core**'s initial codebase).

## 4. Current Strategic Decision (as of [Current Date])

The project is pivoting to a "start fresh" approach for integrating custom platform features on top of **Remodl Core**. This involves:
*   Creating a new base branch (`remodel-v2-base`) in the `Flowise` (Remodl Core) repository, directly from `FlowiseAI/Flowise` main (version 2.2.8).
*   Duplicating the standard `packages/ui` into a new package (e.g., `packages/remodl-ui`) where primary custom UI development will occur. The original `packages/ui` will be kept closer to upstream.
*   Selectively porting essential UI customizations and custom **Remodl Core** nodes to this new clean base, rather than merging an older feature branch with extensive (now potentially redundant) core modifications.
*   This decision is driven by the advancements in the underlying engine (Agent Flow V2, improved streaming, robust MCP) which reduce the need for previous custom core code changes.
