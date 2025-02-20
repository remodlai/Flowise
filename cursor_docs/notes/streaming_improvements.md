# Streaming Improvements

## Overview

Recent improvements to token streaming and Server-Sent Events (SSE) handling focus on ensuring proper token type handling, consistent message formatting, and robust state management during streaming operations.

## Key Improvements

### Token Type Handling

1. **Token Event Types**
```typescript
enum TokenEventType {
    AGENT_REASONING = 'agentReasoning',
    FINAL_RESPONSE = 'finalResponse',
    TOOL_RESPONSE = 'toolResponse'
}
```

2. **Streaming Callback Implementation**
```typescript
handleLLMNewToken(token: string) {
    if (shouldStreamResponse && sseStreamer && token.trim()) {
        const tokenType = isConnectedToEnd ? 
            TokenEventType.FINAL_RESPONSE : 
            TokenEventType.AGENT_REASONING;
        
        sseStreamer.streamTokenEvent(chatId, token, tokenType);
    }
}
```

### SSE Message Formatting

1. **Consistent Message Structure**
```typescript
const clientResponse = {
    event: eventType,
    data: data,
    type: type || TokenEventType.AGENT_REASONING
}
client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
```

2. **Event Type Handling**
- All events now use consistent message format
- Proper event type assignment based on node context
- Improved error handling for malformed messages

### State Management During Streaming

1. **Client State Tracking**
```typescript
type Client = {
    clientType: 'INTERNAL' | 'EXTERNAL'
    response: Response
    started?: boolean
}
```

2. **State Preservation**
- Proper tracking of client state
- Prevention of duplicate start events
- Maintenance of streaming state across operations

### Error Handling

1. **Empty Token Validation**
```typescript
if (client && data?.trim()) {
    // Process token
} else {
    // Skip empty tokens
}
```

2. **Client Validation**
- Check for client existence before streaming
- Validate client state before operations
- Handle disconnection gracefully

## Integration Points

### With Agent Node
- Proper token type handling based on node context
- State preservation during agent operations
- Tool execution event handling

### With LLM Node
- Token streaming during LLM responses
- State management during streaming
- Error handling for LLM operations

## Best Practices

1. **Token Handling**
```typescript
// Always validate tokens before streaming
if (token?.trim()) {
    // Stream token
}

// Use proper token type
const tokenType = isConnectedToEnd ? 
    TokenEventType.FINAL_RESPONSE : 
    TokenEventType.AGENT_REASONING;
```

2. **Message Formatting**
```typescript
// Use consistent message format
const clientResponse = {
    event: eventType,
    data: data
}
client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
```

3. **State Management**
```typescript
// Check client state before operations
if (client && !client.started) {
    // Initialize streaming
    client.started = true
}

// Handle cleanup
if (client) {
    client.response.end()
    delete this.clients[chatId]
}
```

## Testing Considerations

1. **Token Streaming Tests**
- Test empty token handling
- Verify token type assignment
- Check streaming state management

2. **Edge Cases**
- Handle client disconnection
- Test concurrent streaming
- Verify error recovery

3. **Performance Testing**
- Measure streaming latency
- Test with large token streams
- Verify memory usage

## Future Improvements

1. **Enhanced Token Handling**
- Add token batching for efficiency
- Implement backpressure handling
- Add streaming metrics

2. **State Management**
- Add streaming session recovery
- Implement reconnection handling
- Add streaming checkpoints

3. **Error Recovery**
- Add automatic retry mechanisms
- Implement fallback strategies
- Add detailed error reporting

4. **Performance**
- Optimize message formatting
- Add streaming compression
- Implement token buffering

## Maintenance Guidelines

1. **Code Organization**
- Keep streaming logic isolated
- Use consistent error handling
- Maintain clear type definitions

2. **Testing**
- Add tests for new streaming features
- Verify backward compatibility
- Test error scenarios

3. **Documentation**
- Update streaming documentation
- Document new event types
- Keep examples current
