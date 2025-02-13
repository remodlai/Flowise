# Memory and Persistence in Flowise

This document outlines the memory and persistence architecture in Flowise, focusing on the integration with LangGraph checkpointing APIs and our strategy for managing agent memory across different storage backends.

## Overview

Flowise uses a combination of in-memory, SQLite, and Postgres persistence to manage agent memory and state checkpointing. With the new LangGraph integration, our AgentMemory nodes have been updated to leverage the langgraph-checkpoint package, which provides a unified checkpointing mechanism across various storage backends.

## Persistence Implementations

### In-Memory Persistence

- Utilizes the `MemorySaver` from langgraph-checkpoint for ephemeral, thread-level memory.
- Suitable for testing and transient flows.

### In-Memory Agent Memory

- Implements the `AgentMemoryMethods` interface by wrapping the `MemorySaver` from langgraph-checkpoint.
- Provides ephemeral memory storage for agent flows, making it ideal for development and testing environments.
- Supports the `overrideConfig` functionality, enabling runtime configuration from the Flowise UI (e.g., overriding the default `thread_id`), ensuring that custom settings are merged into the memory operations.

### SQLite Persistence

- The `SQLiteAgentMemory` node has been updated to use a SQLite saver that wraps langgraph-checkpoint functionality.
- This implementation leverages SQLite as a lightweight, file-based persistence solution.
- Configuration is managed via additional connection configuration provided in the node inputs.

### Postgres Persistence

- The `PostgresAgentMemory` node has been updated using the `PostgresSaver`, integrating with langgraph-checkpoint.
- It supports both direct database connections and connection pools, configurable via UI inputs (host, port, SSL, and pool settings).
- Provides robust, persistent state storage suitable for production environments.

## Future Work: Long-Term Memory Node

We are planning to introduce a new node type called **LongTermMemory**. This node will:

- Implement cross-thread persistence by leveraging the Store API provided by LangGraph, enabling sharing of memory across multiple conversational threads.
- Provide advanced capabilities such as conversation history summarization and semantic search.
- Support integration with external vector databases (e.g., Pinecone, Upstash Vector) and graph databases (e.g., Neo4j) to facilitate richer, long-term context retrieval.
- Be designed in a backend agnostic manner, allowing the storage solution to be selected based on configuration without major architectural changes.

This new node type will enhance the ability of agents to remember and utilize context over long periods and across different conversations.

## References

- [LangGraph Persistence (In-Memory)](https://langchain-ai.github.io/langgraphjs/how-tos/persistence/)
- [How to use Postgres checkpointer for persistence](https://langchain-ai.github.io/langgraphjs/how-tos/persistence-postgres/)
- [LangGraph Cross-thread Persistence](https://langchain-ai.github.io/langgraphjs/how-tos/cross-thread-persistence/)
- [How to add summary of the conversation history](https://langchain-ai.github.io/langgraphjs/how-tos/add-summary-conversation-history/)
- [How to add semantic search to your agent's memory](https://langchain-ai.github.io/langgraphjs/how-tos/semantic-search/)
