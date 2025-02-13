# Agent Node Refactor Plan

## Current Issues
1. Using outdated Runnable patterns
2. Complex manual state management
3. Mixed old and new LangGraph patterns
4. Overcomplicated tool handling
5. Non-standard state transitions

## Target Architecture
Following LangGraph's native patterns from [multi-agent network example](https://langchain-ai.github.io/langgraphjs/how-tos/multi-agent-network/#travel-recommendations-example)

## Step 1: State Definition
```typescript
const AgentState = Annotation.Root({
    // Base message handling
    messages: MessagesAnnotation,
    
    // Tool execution state
    scratchpad: Annotation<ToolsAgentStep[]>({
        reducer: (_, x) => x,
        default: () => []
    }),
    
    // Agent-specific state
    agentState: Annotation<Record<string, any>>({
        reducer: (curr, next) => ({ ...curr, ...next }),
        default: () => ({})
    })
})

type AgentStateType = typeof AgentState.State
```

## Step 2: Agent Node Structure
```typescript
const createAgentNode = (
    llm: BaseChatModel,
    tools: StructuredTool[],
    config: AgentConfig
) => {
    return async (state: AgentStateType) => {
        // Process input and run LLM
        const result = await llm.invoke(state.messages)
        
        // Handle tool calls or final response
        if (result.tool_calls?.length) {
            return new Command({
                goto: "tools",
                update: { 
                    messages: [result],
                    scratchpad: result.tool_calls
                }
            })
        }
        
        // End if no tools to call
        return new Command({
            goto: END,
            update: { messages: [result] }
        })
    }
}
```

## Step 3: Tool Handling
```typescript
const createToolNode = (tools: StructuredTool[]) => {
    return async (state: AgentStateType) => {
        // Execute tools from scratchpad
        const toolResults = await Promise.all(
            state.scratchpad.map(async (toolCall) => {
                const tool = tools.find(t => t.name === toolCall.name)
                const result = await tool.invoke(toolCall.args)
                return new ToolMessage({
                    content: result,
                    tool_call_id: toolCall.id,
                    name: tool.name
                })
            })
        )

        // Return to agent with tool results
        return new Command({
            goto: "agent",
            update: { 
                messages: toolResults,
                scratchpad: []
            }
        })
    }
}
```

## Step 4: Graph Construction
```typescript
const createAgentGraph = (config: AgentConfig) => {
    const graph = new StateGraph(AgentState)
        // Add nodes
        .addNode("agent", createAgentNode(config.llm, config.tools, config))
        .addNode("tools", createToolNode(config.tools))
        
        // Add edges
        .addEdge("agent", "tools")
        .addEdge("tools", "agent")
        
        // Add entry point
        .addEdge(START, "agent")

    return graph.compile()
}
```

## Step 5: Flowise Integration
1. Update `Agent_SeqAgents` class to use new pattern
2. Maintain UI compatibility
3. Keep existing configuration options
4. Support streaming and interrupts

## Implementation Order
1. Create new state definition
2. Implement basic agent node
3. Add tool handling
4. Add graph construction
5. Update Flowise integration
6. Add streaming support
7. Add interrupt handling
8. Test and validate

## Migration Strategy
1. Create new implementation alongside existing code
2. Test with simple flows first
3. Gradually migrate complex flows
4. Remove old implementation once stable

## Benefits
1. Cleaner state management
2. Native LangGraph patterns
3. Better type safety
4. Simpler tool handling
5. More maintainable code
6. Better error handling
7. Easier to extend

## Considerations
1. Maintain Flowise UI compatibility
2. Support existing configurations
3. Handle streaming properly
4. Support interrupts
5. Maintain type safety
