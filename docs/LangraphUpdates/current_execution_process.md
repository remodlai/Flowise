# Current Execution Process in Flowise

This document outlines the current process of flow execution in Flowise prior to the planned refactor with new LangGraph patterns.

## 1. Flow Data Retrieval and Parsing

- **Flow JSON Source**: The Flowise UI generates a JSON structure that defines the flow. This JSON contains nodes (reactFlowNodes) and edges (reactFlowEdges).
- **Entry Point**: The process begins in `buildChatflow.ts`, where the `utilBuildChatflow` function is invoked at runtime when a request is received.
- **JSON Parsing**: The JSON is retrieved from the database (stored in the chatflow's `flowData`) and parsed to extract the detailed flow definition.

## 2. Building the Execution Graph

- **Manual Wiring**: The parsed JSON is passed to `buildAgentGraph.ts`, which manually constructs the execution graph by iterating over nodes and edges defined in the JSON.
- **Graph Structure**: Nodes are connected based on the UI-generated relationships without a uniform node registration interface. This requires manual handling of conditional logic and edge configurations.

## 3. Node Execution

- **Agent Node (Agent.ts)**: 
  - The `Agent.ts` file (located in `packages/components/nodes/sequentialagents/Agent/Agent.ts`) is a key component for executing agent flows.
  - It performs tasks such as processing system and human prompts, managing message history, and executing tool calls.
  - Agents are built with a mix of LangChain components (e.g., prompts, language models, output parsers) and custom utilities.
- **Tool Integration**: Agents support tool execution via function calling models, using methods like `bindTools` to integrate tool functionalities into the agent's flow.
- **Interruption Handling**: If the agent is configured with interruption enabled, it uses a separate tool node to handle approval prompts and conditional routing.

## 4. Memory and Checkpointing

- **State Management**: Agent memory is managed through the AgentMemory system, which currently supports SQLite and Postgres (with MySQL support being deferred).
- **Checkpointing**: Memory functions and checkpointing are integrated to save and restore state during flow execution. This is handled by separate modules and utilities within the AgentMemory directory.

## 5. Summary and Next Steps

- **Current Process**: 
  - Flow execution begins with JSON retrieval and parsing in `buildChatflow.ts`.
  - The execution graph is built manually in `buildAgentGraph.ts` based on the JSON structure.
  - Agent logic in `Agent.ts` manages prompts, tool calling, message history, and interruption flows.
  - State and checkpointing are handled by the existing AgentMemory implementations.

- **Future Refactor**: 
  - The planned refactor aims to simplify graph building by having sequential agent nodes expose a standardized registration interface for integration with LangGraph APIs.
  - While the UI-generated JSON will remain unchanged, the internal wiring will be streamlined to improve maintainability.

This documentation captures the current architecture and process flow within Flowise as it stands before initiating the refactor towards a more unified LangGraph-based system. 