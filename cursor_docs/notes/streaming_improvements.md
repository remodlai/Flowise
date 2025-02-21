# Streaming Improvements

## Overview

Recent improvements to token streaming and Server-Sent Events (SSE) handling focus on ensuring proper token type handling, consistent message formatting, and robust state management. The key enhancement is the ability to differentiate between agent reasoning and final response tokens based on node connections.

## Latest Agent Node Streaming

### Token Type Differentiation

1. **Node Context Awareness**
```typescript
const streamConfig = {
    configurable: {
        nodeId: nodeData.id,
        isConnectedToEnd
    }
};
```

2. **Streaming Handler**
```typescript
return BaseCallbackHandler.fromMethods({
    handleLLMNewToken(token: string) {
        if (!token?.trim()) return;

        // Initialize streaming if needed
        if (!isStreamingStarted) {
            isStreamingStarted = true;
            sseStreamer.streamTokenStartEvent(chatId);
            sseStreamer.streamAgentReasoningStartEvent(
                chatId,
                isConnectedToEnd ? "startFinalResponseStream" : ""
            );
        }

        // Stream token with proper type
        const tokenType = isConnectedToEnd ? 
            TokenEventType.FINAL_RESPONSE : 
            TokenEventType.AGENT_REASONING;
        sseStreamer.streamTokenEvent(chatId, token, tokenType);
    }
});
```

### State Management During Streaming

1. **State Preservation**
```typescript
// Filter and restructure while maintaining state
const historySelection = (nodeData.inputs?.conversationHistorySelection || 'all_messages');
state.messages = filterConversationHistory(historySelection, options.input, state);
state.messages = restructureMessages(llm, state);
```

2. **Message Updates**
```typescript
// Update state with final message
state.messages = {
    value: state.messages.value,
    default: () => [...state.messages.default(), finalMessage]
};
```

## Token Event Types

```typescript
enum TokenEventType {
    AGENT_REASONING = 'agentReasoning',
    FINAL_RESPONSE = 'finalResponse',
    TOOL_RESPONSE = 'toolResponse'
}
```

## Streaming Events

1. **Start Events**
- streamTokenStartEvent: Initialize token streaming
- streamAgentReasoningStartEvent: Start agent reasoning with context

2. **Token Events**
- streamTokenEvent: Stream individual tokens with type
- streamTokenEndEvent: End token streaming

3. **State Events**
- streamStartEvent: Initialize streaming session
- streamEndEvent: Clean up streaming session

## Error Handling

1. **Token Validation**
```typescript
if (!token?.trim()) return;
```

2. **State Management**
```typescript
try {
    // Stream operations
} catch (error) {
    console.error('[Streaming] Error:', error);
}
```

## Best Practices

1. **Token Handling**
```typescript
// Always validate tokens
if (token?.trim()) {
    sseStreamer.streamTokenEvent(chatId, token, tokenType);
}
```

2. **State Management**
```typescript
// Preserve state structure
state.messages = {
    value: state.messages.value,
    default: () => newMessages
};
```

3. **Error Handling**
```typescript
try {
    if (isStreamingStarted) {
        sseStreamer.streamTokenEndEvent(chatId);
        sseStreamer.streamAgentReasoningEndEvent(chatId);
    }
} catch (error) {
    console.error('[Streaming] Error in cleanup:', error);
}
```

## Integration Points

### With Agent Node
- Token type based on node connection
- State preservation during streaming
- Clean error handling

### With buildAgentGraph
- Proper event propagation
- State management coordination
- Token type determination

## Future Improvements

1. **Performance**
- Token batching for efficiency
- Streaming compression
- Memory optimization

2. **Error Recovery**
- Automatic retry mechanisms
- Graceful degradation
- Better error reporting

3. **State Management**
- Enhanced state validation
- Better type safety
- Improved error context

4. **Testing**
- Streaming integration tests
- State preservation tests
- Error handling coverage
