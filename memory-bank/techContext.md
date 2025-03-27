The project we're developing is called the Remodl AI Platform. It is a platform that is originally based upon Flowise AI, but has been significantly customized and enhanced and is no longer referred to as Flowise, but as the Remodl AI Platform. ⁠The platform itself is designed to enable the rapid development of advanced chatbots and conversational AI implementations that we refer to as chat flows and agent flows. The difference between the chat flow and an agent flow is that a chat flow is singular. It exists with a single purpose, and it does not have the ability to be multi-agent, whether that is a supervisor and worker setup or in a linear cyclical graph. 

Agent flows, on the other hand, are more complex, and they are based on a combination of lang chain and lang graph. They allow for one of two implementations: a standard supervisor-worker relationship, which can be multiple tiers, so a supervisor can also be a worker if there is a level above it, or in the sequential agent flows, which are versions of linear cyclical graphs and allow for flows to be executed and route accordingly using a combination of LLMs, individual agents, which in and of themselves all have tool calling ability, individual tool nodes, and various other logic, including multiple different LLM models and resources. 

A core part of what we've been developing is implementing a few key major points.

1. We have introduced the concept of the platform as the top level. On that platform, applications can be created. These can be considered singular SaaS product offerings that are built on top of the platform but can, will, and do have their own front-end UIs.

2. Each application has customers. Those customers are referred to as organizations. An organization can only belong to a single application at any given time, and they are limited to access only what is available for that application.

3. Users belong to organizations. The only caveat is if someone is a member of the Remodel AI organization, then they are by default able to access all applications on the platform unless assigned a different role.

The reason for this is because the nature of the original Flowise platform, and now we've also been developing further, is to rapidly develop AI agent software solutions that solve specific problems but are built off of a singular underlying framework, which is our Remodel AI platform.

2. We have significant intellectual property that we've developed around the applications of things like Neo4j-based graph databases that are used for things like progressive memory and integration into other additional sources of truth.

3. The overall architecture of developing an individual flow is done visually within the platform by a member of the Remodel AI team and is able to call multiple tools as well as call other chat flows as tools when needed in order to separate out interest and maintain a manageability level when it comes to the individual agents themselves. ⁠

We are still in the process of refactoring certain core functionality of the original codebase, especially around things like handling integrations, database integrations, and multimodal, so images, et cetera. We're not changing most of the core functionality. It's still a node-based method that is built using React Flow, and you can see that if needed in the underlying codebase.

What we've additionally implemented on the backend, we use for the management of everything that is not the core agents themselves, so the agents and tools. Is we've integrated Supabase as both our auth layer and for the management of all of the business logic not directly related to the actual underlying AI agents. So that is everything from application, organization, and user management, other data tracking, so on and so forth.

In between the UI or any UI and the platform server, we are now in the process of implementing an instance of the Zooplo API Gateway, which we refer to as the Remodel API Gateway. And this allows us to manage all of the routes for any interaction between a frontend and backend, and include both our default PKCE JWT-based authorization for an individual user, as well as advanced API management using API keys that are managed through Zooplo. ⁠

Within our workspace, there are three core directories that you need to be aware of. 

1. The core Flowise directory. This is a PNPM mono repo that currently includes four key packages. 

2. The server, which is in the packages/slash/server directory and is named Flowise for now. 

3. The platform UI, which is the core platform management user interface. It is built using React, Vite, and Material at the moment, and is primarily for managing all of the actual development, high-level user management, etc. 
4. The fourth package, which is surely going to be deprecated, is the original API docs that we will reference from time to time, but are being migrated fully over with proper route management using our remodlai-auth directory. 

So that we can maintain proper controls using our rule-based access in Supabase, RLS policies in Supabase, JWT authentication, claims authentication, and API authentication. So that is largely just for reference at the point for the original routes and should not be considered to be any source of truth. ⁠

The second working directory that exists within our workspace is the remodel-auth directory. This is designed as an eventual separate NPM package that will be imported once at a certain state as a dependency for handling client-side auth and route management. 

And will be considered to be something that is required for the development of any additional front-end UI for any individual platform application. Finally, we have the Remodel API Gateway Directory, which is the local pull of the Git repo for our Zooplo instance. And this is what we are actively working on and developing. You should have the documentation available to you for that. ⁠

End users should not be ever logging directly into the platform. ⁠

# Current Workspae Structure:
1. Flowise pnpm monorepo:
   1. 3 packages in the /packages directory:
      1. /server - the main server. In deployment, we actually run this behind a load balancer. We have one main instances and Two worker instances that are managed through Redis and BullMQ to offload and balance the server load. ⁠
      2. /ui - The platform ui (for development and management of ALL aspects of the platform, not indivual end user interaction)
      3. /api-documentation - ignore this
2. remodlai-auth: our in-progress auth package, for managing and interacting with the API gateway and subsequently adding helper functions when used as a depdency in client-side development for managing authorization, authentication, etc.
3. /Users/brianbagdasarian/api-gateway/remodl-platform-api - the local version of our api gateway, linked and synced to our cloud version.  It is imperative that when we're using this, you do not make assumptions on what is or is not available, and you must ask for either links to documentation or for me to clarify a specific purpose. We do not want to be randomly creating code when it may already exist or be a built-in function that you're not aware of, and I can clarify for you. ⁠


The platform overall across everything is in TypeScript, and the server uses Express. We use TypeScript. We use Vite for the platform UI. ⁠And we also have various integrations when it comes to Supabase, etc. Do not install any packages without permission. If you need one installed, ask me to, and I will do it because we have specific things. For instance, in our monorepo, we have specific ways we have to handle adding packages, and we cannot do it without otherwise gently breaking the monorepo structure. ⁠It is also important to understand that remodlai-auth and the remodl-platform-api are not part of the mono repo. ⁠

## Authentication Architecture
1. Supabase Auth:
   - Handles user authentication
   - Custom access token hook in public schema
   - JWT structure:
     * app_metadata: Contains all claims (access control, resource IDs)
     * user_metadata: Contains user profile information
     * Required app_metadata claims: application_id(s), organization_id(s), user_id
   - Direct database updates for hook changes

2. Zuplo API Gateway:
   - Uses Supabase JWT auth policy
   - Requires specific JWT structure
   - Validates claims from app_metadata
   - Uses app_metadata claims for resource access validation
   - Handles route-level authorization