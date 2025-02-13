Overview
We want to refactor our SQLite-based memory nodes so that they fully align with our new LangGraph checkpoint integration and our unified AgentMemory adapter design. In particular, we need to:
• Update the low-level SQLite saver (sqliteSaver.ts) to consistently use the new checkpoint APIs from langgraph-checkpoint-sqlite.
• Expand its interface to include the new memory methods (like getState() and updateState()) that are part of our unified AgentMemoryMethods interface.
• Ensure that the SQLiteAgentMemory node (SQLiteAgentMemory.ts) instantiates the updated SQLiteSaver correctly and supports runtime overrideConfig parameters—just as we already did with our InMemoryAgentMemory.
These changes are in keeping with our overall design goals of backend agnosticism and uniform, simple APIs for managing memory and state.
---
Sequential Implementation Plan
Review the Current Implementation of sqliteSaver.ts
Goal: Identify how the current SQLite saver is implemented and how it integrates with langgraph-checkpoint-sqlite.
Planned Change:
Update the imports to ensure you’re using the latest checkpoint-sqlite API.
Verify that the serialization (dumpsTyped/loadsTyped) is consistent with the new checkpoint API requirements.
Add or expose any missing memory methods (e.g., getState(), updateState()) so that this saver can be used uniformly across all memory nodes.
Reference: SQLiteSaver Documentation
Extend sqliteSaver.ts to Support the Unified Memory Interface
Goal: Implement (or expose wrappers for) additional methods so that the SQLite saver adheres to our AgentMemoryMethods interface.
Planned Change:
Add a getState() method that retrieves the current checkpoint’s state (e.g., the channel_values).
Add an updateState(newState) method that merges current state with new state and writes the updated checkpoint using the put method.
Note: This will bring the SQLite saver’s functionality in line with what we did for InMemoryAgentMemory.
3. Update SQLiteAgentMemory.ts to Use the Updated sqliteSaver.ts
Goal: Ensure the memory node for SQLite uses the updated saver implementation.
Planned Change:
In the init() method of SQLiteAgentMemory.ts, pass in any new configuration (such as overrideConfig) to the saver if needed.
Remove any deprecated or unnecessary options (if applicable) and align the node’s configuration with our new pattern.
Reference: Review how InMemoryAgentMemory supports overrideConfig and apply a similar pattern here.
Incorporate OverrideConfig Support in the SQLite Module
Goal: Ensure that runtime overrides provided through the Flowise UI (via overrideConfig) are merged into the configuration used by both the saver and the node.
Planned Change:
Update the configuration object in SQLiteAgentMemory.ts (and, if applicable, within sqliteSaver.ts) to merge the overrideConfig parameters into the RunnableConfig.
This will guarantee that any changes made via the UI (or at the predictions endpoint) are applied—thus ensuring consistency across nodes.
Test the Refactored Components Thoroughly
Goal: Validate that both the updated sqliteSaver.ts and the SQLiteAgentMemory node operate correctly.
Planned Change:
Execute a series of tests (both unit tests and integration tests) to confirm that checkpointing, state retrieval, update methods, and overrideConfig functionality work as intended.
Note: Ensure the new methods (getState, updateState, etc.) are correctly integrated and that the state persists as expected.
6. Update Documentation
Goal: Document all changes and update our technical documentation.
Planned Change:
Include a section in memory_and_persistance.md (which we have already updated) to explain how SQLite persistence now supports the unified AgentMemory API and overrideConfig functionality.
Provide examples (if needed) on how the new configuration merging works.
Review, Refine, and Merge
Goal: Once verified, merge the changes into the main branch following code review.
Planned Change:
Use our version control process to iterate on feedback and finalize the update.
---
Summary
The planned changes aim to unify memory handling across different backends (in-memory, SQLite, Postgres) by extending the SQLite saver to support new API methods (getState, updateState) and by ensuring that all nodes—whether memory nodes or other types—leverage overrideConfig as defined in the UI. This not only simplifies the internal implementation but also ensures consistent runtime behavior across the entire Flowise platform.
References:
LangGraph Persistence Guide
SQLiteSaver Documentation