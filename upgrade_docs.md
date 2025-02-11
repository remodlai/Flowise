# Upgrade Documentation for Sequential Agents Migration to LangGraph API

## 1. Introduction

This document outlines the migration plan for Flowise's @sequentialagents module to the latest LangGraph API. The goal of this migration is to enable advanced features such as token-by-token streaming, final node streaming, enhanced human-in-the-loop interactions (e.g., waiting for user input), and improved memory management using checkpoints.

## 2. Goals of the Migration

- **Streaming LLM Tokens:** Enable token-by-token streaming so that the agent outputs updates in real time.
- **Streaming from the Final Node:** Stream the final output as it is generated, enhancing interactivity.
- **Human-in-the-Loop Enhancements:** Integrate wait-for-user-input nodes to allow pausing and resuming execution.
- **Memory Improvements:** Upgrade memory handling using the new checkpoint mechanisms from @langchain/langgraph-checkpoint for better state management.

## 3. Planned Improvements

### 3.1 Streaming LLM Tokens Support

- Update the agent and LLM node implementations to leverage methods like `agent.stream()` and `agent.streamEvents()` as described in the [Streaming LLM Tokens Guide](https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/).
- Modify model binding so that the language model supports token streaming automatically.

### 3.2 Streaming from the Final Node

- Adjust the final node processing to enable streaming of the final answer as soon as it is generated, referencing the [Streaming from the Final Node Guide](https://langchain-ai.github.io/langgraphjs/how-tos/streaming-from-final-node/#define-model-and-tools).

### 3.3 Enhanced Human-in-the-Loop (Wait for User Input)

- Integrate a new wait node or a pause mechanism into the agent graph that stops execution until a user input is received.
- Update the state management to track pending user input and resume workflows.
- See the [Wait User Input Guide](https://langchain-ai.github.io/langgraphjs/how-tos/wait-user-input/) for details.

### 3.4 Memory and Checkpoint Improvements

- Ensure that the updated memory modules (e.g., AgentMemory, using SQLite/Postgres/MySQL savers) properly integrate with the new state management.
- Use the checkpoint functionality provided by @langchain/langgraph-checkpoint to store, retrieve, and update agent states.

## 4. Implementation Plan

1. **State Management Update:**
   - Review and refactor the current state (ISeqAgentsState) to align with LangGraph's new patterns.
   - Integrate with the checkpoint system for persisting state data.

2. **Agent Node Refactoring:**
   - Update the Agent node (`Agent.ts`) to use `RunnableSequence` and `RunnablePassthrough` following the new API.
   - Refactor interrupt and tool integration logic with modern LangGraph patterns.

3. **Tool Node Update:**
   - Refactor the custom `ToolNode` to adhere to the latest StructuredTool interfaces and function calling conventions.

4. **Graph Construction:**
   - Update the graph construction code (using `StateGraph`) to more modularly configure nodes and edges as per the new LangGraph API.

5. **Human-in-the-Loop Integration:**
   - Add a new node type or mechanism to wait for user input and manage pause/resume flows.

6. **Memory Module Verification:**
   - Ensure that AgentMemory modules (SQLite, Postgres, MySQL) are functioning correctly with the new checkpoint API.

7. **Testing Strategy:**
   - Write unit tests for each module (state management, agent execution, tool integration, memory persistence).
   - Perform integration tests to ensure the end-to-end workflow remains intact.

## 5. Testing Strategy

- **Unit Tests:** Focus on isolated modules like state management, streaming functionality, tool execution, and memory read/write operations.
- **Integration Tests:** Validate the full agent workflow including streaming output, human-in-the-loop pauses, and state persistence across sessions.

## 6. References

- [How to stream LLM tokens from your graph](https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/)
- [How to stream from the final node](https://langchain-ai.github.io/langgraphjs/how-tos/streaming-from-final-node/#define-model-and-tools)
- [How to wait for user input](https://langchain-ai.github.io/langgraphjs/how-tos/wait-user-input/)

## 7. Additional Advanced Features

Beyond the core migration objectives, there are several advanced functionalities that are higher priority for improving agent performance and scalability:

### 7.1 Conversation History Summarization

- **Goal:** Automatically summarize conversation history to reduce context size and cost, enabling long conversations without overwhelming the LLM's token limits.
- **Implementation:**
  - Implement a summarization node in the graph that triggers when conversation history exceeds a defined threshold.
  - Use a system prompt to generate a summary based on past messages as described in the [Add Summary of the Conversation History Guide](https://langchain-ai.github.io/langgraphjs/how-tos/add-summary-conversation-history/).

### 7.2 Cross-Thread Persistence

- **Goal:** Ensure that conversation state and memory can be persistently stored and accessed across different threads or sessions.
- **Implementation:**
  - Integrate cross-thread persistence mechanisms by updating the state management system and memory modules.
  - Leverage patterns from the [Cross Thread Persistence Guide](https://langchain-ai.github.io/langgraphjs/how-tos/cross-thread-persistence/) to store and retrieve state using appropriate checkpointing, so that conversations can resume seamlessly even after thread changes.

### 7.3 Semantic Search Integration

- **Goal:** Integrate semantic search capabilities to efficiently retrieve relevant pieces of conversation context and memory.
- **Implementation:**
  - Implement a semantic search function within AgentMemory or state management that indexes conversation content.
  - Utilize techniques and tools from the [Semantic Search Guide](https://langchain-ai.github.io/langgraphjs/how-tos/semantic-search/) to allow the agent to query its past conversation effectively.

These advanced features will complement the core migration work and provide enhanced usability, scalability, and efficiency in handling long conversations and multi-threaded environments. They mark a significant step forward in making the agent more intelligent and context-aware while keeping resource usage optimal.

## 8. Extensive Plan for Agent Memory and Streaming Enhancements

### 8.1 Overview

This section outlines the necessary changes to improve the robustness of agent memory management and implement token streaming for the final node. These changes build on the original Flowise implementation and adhere to current best practices from LangGraphJS.

### 8.2 Memory Refactoring

**Current Issue:**
- The existing implementation in `State.ts` initializes state with a default 'messages' key configured for append behavior. However, the update function (`putTuple`) uses a shallow merge (`{ ...currentState, ...tuple }`), which overwrites values instead of merging them as intended.

**Proposed Solution:**
- Refactor the `putTuple` function to iterate through each key in the incoming tuple.
- For keys configured with the "Append" operation (such as "messages"):
  - Retrieve the current value from the state.
  - Use the provided merging function (e.g., `(x, y) => x.concat(y)`) to append the new data.
- For keys with the "Replace" operation:
  - Update only if the new value is non-null; otherwise, retain the existing value.
- Ensure that the initial overrideConfig provided via the API is merged with the pre-existing state rather than completely replacing it.

**Checkpoint 1:**
- Manually test that initiating a run with an overrideConfig setting for `stateMemory` correctly preserves and appends to the existing messages array without overwriting it.

### 8.3 Streaming from the Final Node

**Current Issue:**
- The final node currently waits for the complete LLM response, delaying the output. There is no token-by-token streaming mechanism.

**Proposed Solution:**
- Update the final node (likely within `Agent.ts` or an equivalent handler) to use the LangGraphJS streaming API.
- Implement an asynchronous iterator (using a `for await...of` loop) to process and emit tokens as they are received.
- Ensure that the streaming mechanism works in tandem with the state management so that any new tokens can be appended to the state in real time.

**Checkpoint 2:**
- Verify through local testing that individual tokens are streamed progressively and that the UI (or logging mechanism) reflects real-time updates.

### 8.4 Integration and Testing

**Steps:**
1. **Memory Module Refactoring:**
   - Implement enhanced merging logic in `putTuple` to handle 'Append' and 'Replace' operations correctly.
   - Verify that keys such as "messages" accumulate new data properly.

2. **Final Node Streaming Implementation:**
   - Update the final node to initiate a streaming LLM response and process it token-by-token.
   - Ensure that state updates occur concurrently with the token stream.

3. **Local Testing:**
   - Run scenarios with overrideConfig to confirm that the sessionId and stateMemory remain intact.
   - Test end-to-end streaming to ensure that both improvements function as expected.

4. **Documentation and Final Reviews:**
   - Update related documentation to reflect these changes.
   - Validate that the enhancements satisfy both legacy functionality and new interactive features.

**Checkpoint 3:**
- Complete comprehensive manual tests covering state merging, token streaming, and preservation of the initial overrideConfig settings.

### 8.5 Timeline and Risk Mitigation

- **Phase 1 (1-2 days):** Refine and test the `putTuple` function in the memory module.
- **Phase 2 (1-2 days):** Implement and validate token streaming in the final node.
- **Phase 3 (1 day):** Integrate, document, and perform final testing.
- **Risk Mitigation:** Maintain a backup of the previous implementation and enable a fallback to the original behavior if critical issues are encountered.

## 9. Agent Node State Update Refactoring

### 9.1 Overview

This plan focuses on refining the state update logic within the Agent node to ensure that all state mutations are centralized in the State module. The goal is to remove direct state mutations in Agent.ts and delegate merging and updating responsibilities to the checkpointMemory API provided in the State node, aligning with our overall architecture and LangGraphJS best practices.

### 9.2 Current Issues

- **Direct State Mutation:**
  Agent.ts currently updates the state directly (e.g. assigning to `state.messages` via `filterConversationHistory` and `restructureMessages`), which can inadvertently overwrite persisted state.

- **Duplication of Logic:**
  The Agent node is handling state filtering and merging in addition to its core role of orchestrating agent execution.

### 9.3 Proposed Changes

1. **Local Filtering of Conversation History:**
   - Instead of mutating the global state, Agent.ts should create a local copy of the relevant state (e.g., a subset of messages) using `filterConversationHistory` and `restructureMessages` to prepare the prompt for the LLM.

2. **Delegate State Updates to the State Node:**
   - Remove direct assignments and mutations on the global state within Agent.ts.
   - When new outputs or tool results are generated, package them as state updates and delegate merging to the checkpointMemory API by calling its `putTuple` method. This ensures that append operations (e.g., for messages) and replace operations are handled according to the per-channel logic defined in the State node.

3. **Centralize Update Logic in getReturnOutput:**
   - Ensure that the getReturnOutput function is the single point of truth for formatting and applying state updates. Agent.ts should use this function to get a clean, merged state based on agent outputs, and then pass it to the State node for persistence.

4. **Maintain Separation of Concerns:**
   - Agent.ts should solely focus on orchestrating agent execution and creating a suitable input for the LLM. All state persistence and merging details should be confined to the State node and its checkpointMemory interface.

### 9.4 Checkpoints and Testing

- **Checkpoint 1:** Validate that after an agent run, the global state remains intact and only the intended updates (e.g., appended messages) are applied.

- **Checkpoint 2:** Confirm via local testing that filtering the conversation history for prompt generation does not affect the persistent state used by subsequent nodes.

- **Checkpoint 3:** Test that the state updates (e.g., tool outputs) are correctly processed via getReturnOutput and merged using checkpointMemory.putTuple, without overwriting historical messages.

### 9.5 Timeline and Risk Mitigation

- **Phase 1 (1 day):** Refactor the agentNode function in Agent.ts to remove direct state mutations and use local copies for LLM input filtering.
- **Phase 2 (1 day):** Integrate state updates through getReturnOutput and checkpointMemory.putTuple.
- **Phase 3 (0.5 day):** Conduct comprehensive local tests and ensure that the global state remains stable across multiple runs.
- **Risk Mitigation:** Maintain backups of the original Agent.ts code, and ensure fallback to legacy behavior if unexpected issues arise.

---

This document will serve as a guide for the developers undertaking the migration to ensure that the advanced features of the new LangGraph API are enabled while maintaining core Flowise functionality. 