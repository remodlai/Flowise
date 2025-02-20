# Human-in-the-loop

When creating LangGraph agents, it is often nice to add a human in the loop
component. This can be helpful when giving them access to tools. Often in these
situations you may want to manually approve an action before taking.

This can be in several ways, but the primary supported way is to add an
"interrupt" before a node is executed. This interrupts execution at that node.
You can then resume from that spot to continue.

<div class="admonition tip">
    <p class="admonition-title">Note</p>
    <p>
        In this how-to, we will create our agent from scratch to be transparent (but verbose). You can accomplish similar functionality using either `interruptBefore` or `interruptAfter` in the <code>createReactAgent(model, tools=tool, interruptBefore=["tools" | "agent"], interruptAfter=["tools" | "agent"])</code> <a href="https://langchain-ai.github.io/langgraph/reference/prebuilt/#createreactagent">API doc</a> constructor. This may be more appropriate if you are used to LangChain's <a href="https://js.langchain.com/v0.2/docs/how_to/agent_executor">AgentExecutor</a> class.
    </p>
</div>

## Setup

First we need to install the packages required

```bash
yarn add @langchain/langgraph
```

Next, we need to set API keys for OpenAI (the LLM we will use). Optionally, we
can set API key for [LangSmith tracing](https://smith.langchain.com/), which
will give us best-in-class observability.


```typescript
// process.env.OPENAI_API_KEY = "sk_...";

// Optional, add tracing in LangSmith
// process.env.LANGCHAIN_API_KEY = "ls__...";
// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_PROJECT = "Human-in-the-loop: LangGraphJS";
```

    Human-in-the-loop: LangGraphJS


## Set up the State

The state is the interface for all the nodes.



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
create a placeholder "search engine". However, it is really easy to create your
own tools - see the
[LangChain documentation](https://js.langchain.com/docs/modules/agents/tools/)
on how to do that.


```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const searchTool = new DynamicStructuredTool({
  name: "search",
  description: "Call to surf the web.",
  schema: z.object({
    query: z.string().describe("The query to use in your search."),
  }),
  func: async ({ query }: { query: string }) => {
    // This is a placeholder for the actual implementation
    // Don't let the LLM know this though 😊
    return "It's sunny in San Francisco, but you better look out if you're a Gemini 😈.";
  },
});

const tools = [searchTool];
```

    [WARN]: You have enabled LangSmith tracing without backgrounding callbacks.
    [WARN]: If you are not using a serverless environment where you must wait for tracing calls to finish,
    [WARN]: we suggest setting "process.env.LANGCHAIN_CALLBACKS_BACKGROUND=true" to avoid additional latency.


We can now wrap these tools in a simple
[ToolNode](https://langchain-ai.github.io/langgraphjs/reference/classes/prebuilt.ToolNode.html).

This is a simple class that takes in a list of messages containing an
[AIMessage with tool_calls](https://v02.api.js.langchain.com/classes/langchain_core_messages.AIMessage.html),
runs the tools, and returns the output as\
[ToolMessage](https://v02.api.js.langchain.com/classes/langchain_core_messages_tool.ToolMessage.html)s.


```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage } from "@langchain/core/messages";

const toolNode = new ToolNode<{ messages: BaseMessage[] }>(tools);
```

## Set up the model

Now we need to load the chat model we want to use. Since we are creating a
tool-using ReAct agent, we want to make sure the model supports
[Tool Calling](https://js.langchain.com/docs/modules/model_io/models/chat/function-calling/)
and works with chat messages.

Note: these model requirements are not requirements for using LangGraph - they
are just requirements for this one example.


```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ temperature: 0 });

// After we've done this, we should make sure the model knows that it has these tools available to call.
// We can do this by binding the tools to the model class.
const boundModel = model.bindTools(tools);
```

## Define the nodes

We now need to define a few different nodes in our graph. In `langgraph`, a node
can be either a function or a\
[runnable](https://js.langchain.com/docs/modules/runnables/). There are two main
nodes we need for this:

1. The agent: responsible for deciding what (if any) actions to take.
2. A function to invoke tools: if the agent decides to take an action, this
   node\
   will then execute that action.

We will also need to define some edges. Some of these edges may be conditional.
The reason they are conditional is that based on the output of a node, one of
several paths may be taken. The path that is taken is not known until that node
is run (the LLM decides).

1. Conditional Edge: after the agent is called, we should either: a. If the
   agent said to take an action, then the function to invoke tools should be
   called\
   b. If the agent said that it was finished, then it should finish
2. Normal Edge: after the tools are invoked, it should always go back to the
   agent to decide what to do next

Let's define the nodes, as well as a function to decide how what conditional
edge to take.


```typescript
import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { END } from "@langchain/langgraph";

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
  const response = await boundModel.invoke(messages, config);
  return { messages: [response] };
};
```

## Define the graph

We can now put it all together and define the graph!



```typescript
import { END, START, StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";

const workflow = new StateGraph<IState>({
  channels: graphState,
})
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage, { tools: "tools", finish: END })
  .addEdge("tools", "agent");

// **Persistence**
// Human-in-the-loop workflows require a checkpointer to ensure
// nothing is lost between interactions
const checkpointer = new MemorySaver();

// **Interrupt**
// To always interrupt before a particular node, pass the name of the node to `interruptBefore` when compiling.
const graph = workflow.compile({ checkpointer, interruptBefore: ["tools"] });
```

## Interacting with the Agent

We can now interact with the agent and see that it stops before calling a tool.



```typescript
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  isAIMessage,
} from "@langchain/core/messages";

const prettyPrint = (message: BaseMessage) => {
  let txt = `[${message._getType()}]: ${message.content}`;
  if (
    isAIMessage(message) && (message as AIMessage)?.tool_calls?.length || 0 > 0
  ) {
    const tool_calls = (message as AIMessage)?.tool_calls
      ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
      .join("\n");
    txt += ` \nTools: \n${tool_calls}`;
  }
  console.log(txt);
};

const config = { configurable: { thread_id: "example-thread-1" } };

let inputs = { messages: [new HumanMessage("hi! I'm bob")] };
for await (
  const { messages } of await graph.stream(inputs, {
    ...config,
    streamMode: "values",
  })
) {
  prettyPrint(messages[messages.length - 1]);
}
```

    [human]: hi! I'm bob


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    [ai]: Hello Bob! How can I assist you today?



```typescript
inputs = { messages: [new HumanMessage("What did I tell you my name was?")] };
for await (
  const { messages } of await graph.stream(inputs, {
    ...config,
    streamMode: "values",
  })
) {
  prettyPrint(messages[messages.length - 1]);
}
```

    [human]: What did I tell you my name was?


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    [ai]: You mentioned that your name is Bob. How can I help you, Bob?



```typescript
inputs = { messages: [new HumanMessage("what's the weather in sf now?")] };
for await (
  const { messages } of await graph.stream(inputs, {
    ...config,
    streamMode: "values",
  })
) {
  prettyPrint(messages[messages.length - 1]);
}
```

    [human]: what's the weather in sf now?
    [ai]:  
    Tools: 
    - search({"query":"weather in San Francisco"})


**Resume**

We can now call the agent again with no inputs to continue, ie. run the tool as
requested.

Running an interrupted graph with `null` as the input means to "proceed as if
the interruption didn't occur."


```typescript
for await (
  const { messages } of await graph.stream(null, {
    ...config,
    streamMode: "values",
  })
) {
  prettyPrint(messages[messages.length - 1]);
}
```

    [tool]: It's sunny in San Francisco, but you better look out if you're a Gemini 😈.


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    [ai]: It seems like it's sunny in San Francisco at the moment. If you need more detailed weather information, feel free to ask!



```typescript

```
