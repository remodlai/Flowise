# Streaming Tokens

In this example, we will stream tokens from the language model powering an
agent. We will use a ReAct agent as an example. The tl;dr is to use
[streamEvents](https://js.langchain.com/v0.2/docs/how_to/chat_streaming/#stream-events)
([API Ref](https://api.js.langchain.com/classes/langchain_core_runnables.Runnable.html#streamEvents)).

<div class="admonition info">
    <p class="admonition-title">Note</p>
    <p>
      If you are using a version of `@langchain/core` < 0.2.3, when calling chat models or LLMs you need to call `await model.stream()` within your nodes to get token-by-token streaming events, and aggregate final outputs if needed to update the graph state. In later versions of `@langchain/core`, this occurs automatically, and you can call `await model.invoke()`.

      For more on how to upgrade `@langchain/core`, check out [the instructions here](https://js.langchain.com/v0.2/docs/how_to/installation/#installing-integration-packages).
    </p>
</div>

This how-to guide closely follows the others in this directory, showing how to
incorporate the functionality into a prototypical agent in LangGraph.

This works for
[StateGraph](https://langchain-ai.github.io/langgraphjs/reference/classes/index.StateGraph.html)
and all its subclasses, such as
[MessageGraph](https://langchain-ai.github.io/langgraphjs/reference/classes/index.MessageGraph.html).

<div class="admonition info">
    <p class="admonition-title">Streaming Support</p>
    <p>
        Token streaming is supported by many, but not all chat models. Check to see if your LLM integration supports token streaming <a href="https://js.langchain.com/v0.2/docs/integrations/chat/">here (doc)</a>. Note that some integrations may support _general_ token streaming but lack support for streaming tool calls.
    </p>
</div>

<div class="admonition tip">
    <p class="admonition-title">Note</p>
    <p>
        In this how-to, we will create our agent from scratch to be transparent (but verbose). You can accomplish similar functionality using the <code>createReactAgent(model, tools=tool)</code> (<a href="https://langchain-ai.github.io/langgraphjs/reference/functions/prebuilt.createReactAgent.html">API doc</a>) constructor. This may be more appropriate if you are used to LangChain's <a href="https://js.langchain.com/v0.2/docs/how_to/agent_executor">AgentExecutor</a> class.
    </p>
</div>

## Setup

This guide will use OpenAI's GPT-4o model. We will optionally set our API key
for [LangSmith tracing](https://smith.langchain.com/), which will give us
best-in-class observability.

---


```typescript
// process.env.OPENAI_API_KEY = "sk_...";

// Optional, add tracing in LangSmith
// process.env.LANGCHAIN_API_KEY = "ls__...";
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_PROJECT = "Stream Tokens: LangGraphJS";
```

## Define the state

The state is the interface for all of the nodes in our graph.



```typescript
import { BaseMessage } from "@langchain/core/messages";
import { StateGraphArgs } from "@langchain/langgraph";

interface IState {
  messages: BaseMessage[];
}

// This defines the agent state
const graphState: StateGraphArgs<IState>["channels"] = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
};
```

## Set up the tools

We will first define the tools we want to use. For this simple example, we will
use create a placeholder search engine. However, it is really easy to create
your own tools - see documentation
[here](https://js.langchain.com/v0.2/docs/how_to/custom_tools) on how to do
that.



```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const searchTool = new DynamicStructuredTool({
  name: "search",
  description:
    "Use to surf the web, fetch current information, check the weather, and retrieve other information.",
  schema: z.object({
    query: z.string().describe("The query to use in your search."),
  }),
  func: async ({ query: _query }: { query: string }) => {
    // This is a placeholder for the actual implementation
    return "Cold, with a low of 3℃";
  },
});

await searchTool.invoke({ query: "What's the weather like?" });

const tools = [searchTool];
```




    [32m"Cold, with a low of 3℃"[39m



We can now wrap these tools in a simple
[ToolNode](https://langchain-ai.github.io/langgraphjs/reference/classes/prebuilt.ToolNode.html).
This object will actually run the tools (functions) whenever they are invoked by
our LLM.



```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage } from "@langchain/core/messages";

const toolNode = new ToolNode<{ messages: BaseMessage[] }>(tools);
```

## Set up the model

Now we will load the
[chat model](https://js.langchain.com/v0.2/docs/concepts/#chat-models).

1. It should work with messages. We will represent all agent state in the form
   of messages, so it needs to be able to work well with them.
2. It should work with
   [tool calling](https://js.langchain.com/v0.2/docs/how_to/tool_calling/#passing-tools-to-llms),
   meaning it can return function arguments in its response.

<div class="admonition tip">
    <p class="admonition-title">Note</p>
    <p>
        These model requirements are not general requirements for using LangGraph - they are just requirements for this one example.
    </p>
</div>


```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o" });
```

After we've done this, we should make sure the model knows that it has these
tools available to call. We can do this by calling
[bindTools](https://v01.api.js.langchain.com/classes/langchain_core_language_models_chat_models.BaseChatModel.html#bindTools).


```typescript
const boundModel = model.bindTools(tools);
```

## Define the graph

We can now put it all together. Time travel requires a checkpointer to save the
state - otherwise you wouldn't have anything go `get` or `update`. We will use
the
[MemorySaver](https://langchain-ai.github.io/langgraphjs/reference/classes/index.MemorySaver.html),
which "saves" checkpoints in-memory.



```typescript
import { END, START, StateGraph } from "@langchain/langgraph";
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
} from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { concat } from "@langchain/core/utils/stream";

const routeMessage = (state: IState) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If no tools are called, we can finish (respond to the user)
  if (!lastMessage?.tool_calls?.length) {
    return END;
  }
  // Otherwise if there is, we continue and call the tools
  return "tools";
};

const callModel = async (
  state: IState,
  config: RunnableConfig,
) => {
  const { messages } = state;
  const responseMessage = await boundModel.invoke(messages);
  return { messages: [responseMessage] };

  // For versions of @langchain/core < 0.2.3, you must call `.stream()`
  // and aggregate the response instead of calling `.invoke()`.

  // const streamOut = await boundModel.stream(messages, config);
  // let finalMessage: AIMessageChunk | undefined = undefined;
  // for await (const chunk of streamOut) {
  //   if (finalMessage === undefined) {
  //     finalMessage = chunk;
  //   } else {
  //     finalMessage = concat(finalMessage, chunk);
  //   }
  // }
  // if (finalMessage === undefined) {
  //   throw new Error("Empty response from chat model.");
  // }
  // return { messages: [finalMessage] };
};

const workflow = new StateGraph<IState>({
  channels: graphState,
})
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent");

const graph = workflow.compile();
```

## Call streamEvents

We can now interact with the agent. Between interactions you can get and update
state.



```typescript
import { ChatGenerationChunk } from "@langchain/core/outputs";
import { AIMessageChunk } from "@langchain/core/messages";

let config = { configurable: { thread_id: "conversation-num-1" } };
let inputs = { messages: [["user", "Hi I'm Jo."]] };

for await (
  const event of await graph.streamEvents(inputs, {
    ...config,
    streamMode: "values",
    version: "v1",
  })
) {
  if (event.event === "on_llm_stream") {
    let chunk: ChatGenerationChunk = event.data?.chunk;
    let msg = chunk.message as AIMessageChunk;
    if (msg.tool_call_chunks && msg.tool_call_chunks.length > 0) {
      console.log(msg.tool_call_chunks);
    } else {
      console.log(msg.content);
    }
  }
}
```

    
    Hello
     Jo
    !
     How
     can
     I
     assist
     you
     today
    ?
    


## How to stream tool calls

Many providers support token-level streaming of tool invocations. To get the
partially populated results, you can access the message chunks'
`tool_call_chunks` property.


```typescript
for await (
  const event of await graph.streamEvents(
    { messages: [["user", "What's the weather like today?"]] },
    {
      ...config,
      streamMode: "values",
      version: "v1",
    },
  )
) {
  if (event.event === "on_llm_stream") {
    let chunk: ChatGenerationChunk = event.data?.chunk;
    let msg = chunk.message as AIMessageChunk;
    if (msg.tool_call_chunks && msg.tool_call_chunks.length > 0) {
      console.log(msg.tool_call_chunks);
    } else {
      console.log(msg.content);
    }
  }
}
```

    [
      {
        name: "search",
        args: "",
        id: "call_zesYhE7nGptBKnmj5yD78yrB",
        index: 0
      }
    ]
    [ { name: undefined, args: '{"', id: undefined, index: 0 } ]
    [ { name: undefined, args: "query", id: undefined, index: 0 } ]
    [ { name: undefined, args: '":"', id: undefined, index: 0 } ]
    [ { name: undefined, args: "current", id: undefined, index: 0 } ]
    [ { name: undefined, args: " weather", id: undefined, index: 0 } ]
    [ { name: undefined, args: '"}', id: undefined, index: 0 } ]
    
    
    The
     weather
     today
     is
     quite
     cold
    ,
     with
     temperatures
     dropping
     to
     a
     low
     of
     
    3
    ℃
    .
    

