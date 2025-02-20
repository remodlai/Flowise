# Get State and Update State

Once you start [checkpointing](./persistence.ipynb) your graphs, you can easily
**get** or **update** the state of the agent at any point in time. This permits
a few things:

1. You can surface a state during an interrupt to a user to let them accept an
   action.
2. You can **rewind** the graph to reproduce or avoid issues.
3. You can **modify** the state to embed your agent into a larger system, or to
   let the user better control its actions.

The key methods used for this functionality are:

- [getState](https://langchain-ai.github.io/langgraphjs/reference/classes/pregel.Pregel.html#getState):
  fetch the values from the target config
- [updateState](https://langchain-ai.github.io/langgraphjs/reference/classes/pregel.Pregel.html#updateState):
  apply the given values to the target state

**Note:** this requires passing in a checkpointer.

<!-- Example:
```javascript
TODO
...
``` -->

This works for
[StateGraph](https://langchain-ai.github.io/langgraphjs/reference/classes/index.StateGraph.html)
and all its subclasses, such as
[MessageGraph](https://langchain-ai.github.io/langgraphjs/reference/classes/index.MessageGraph.html).

Below is an example.

<div class="admonition tip">
    <p class="admonition-title">Note</p>
    <p>
        In this how-to, we will create our agent from scratch to be transparent (but verbose). You can accomplish similar functionality using the <code>createReactAgent(model, tools=tool, checkpointer=checkpointer)</code> (<a href="https://langchain-ai.github.io/langgraphjs/reference/functions/prebuilt.createReactAgent.html">API doc</a>) constructor. This may be more appropriate if you are used to LangChain's <a href="https://js.langchain.com/v0.2/docs/how_to/agent_executor">AgentExecutor</a> class.
    </p>
</div>

## Setup

This guide will use OpenAI's GPT-4o model. We will optionally set our API key
for [LangSmith tracing](https://smith.langchain.com/), which will give us
best-in-class observability.


```typescript
// process.env.OPENAI_API_KEY = "sk_...";

// Optional, add tracing in LangSmith
// process.env.LANGCHAIN_API_KEY = "ls__...";
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_PROJECT = "Time Travel: LangGraphJS";
```

    Time Travel: LangGraphJS


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
  func: async ({ query }: { query: string }) => {
    // This is a placeholder for the actual implementation
    return "Cold, with a low of 13 ℃";
  },
});

await searchTool.invoke({ query: "What's the weather like?" });

const tools = [searchTool];
```

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
import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MemorySaver } from "@langchain/langgraph";

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

const workflow = new StateGraph<IState>({
  channels: graphState,
})
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage, { finish: END, tools: "tools" })
  .addEdge("tools", "agent");

// Here we only save in-memory
let memory = new MemorySaver();
const graph = workflow.compile({ checkpointer: memory });
```

## Interacting with the Agent

We can now interact with the agent. Between interactions you can get and update
state.


```typescript
let config = { configurable: { thread_id: "conversation-num-1" } };
let inputs = { messages: [["user", "Hi I'm Jo."]] };
for await (
  const { messages } of await graph.stream(inputs, {
    ...config,
    streamMode: "values",
  })
) {
  let msg = messages[messages?.length - 1];
  if (msg?.content) {
    console.log(msg.content);
  } else if (msg?.tool_calls?.length > 0) {
    console.log(msg.tool_calls);
  } else {
    console.log(msg);
  }
  console.log("-----\n");
}
```

    [ [32m'user'[39m, [32m"Hi I'm Jo."[39m ]
    -----
    


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    Hello, Jo! How can I assist you today?
    -----
    


See LangSmith example run here
https://smith.langchain.com/public/b3feb09b-bcd2-4ad5-ad1d-414106148448/r

Here you can see the "agent" node ran, and then our edge returned `__end__` so
the graph stopped execution there.

Let's check the current graph state.


```typescript
let checkpoint = await graph.getState(config);
checkpoint.values;
```

    {
      messages: [
        [ [32m'user'[39m, [32m"Hi I'm Jo."[39m ],
        AIMessage {
          lc_serializable: [33mtrue[39m,
          lc_kwargs: [36m[Object][39m,
          lc_namespace: [36m[Array][39m,
          content: [32m'Hello, Jo! How can I assist you today?'[39m,
          name: [90mundefined[39m,
          additional_kwargs: {},
          response_metadata: [36m[Object][39m,
          tool_calls: [],
          invalid_tool_calls: []
        }
      ]
    }


The current state is the two messages we've seen above, 1. the HumanMessage we
sent in, 2. the AIMessage we got back from the model.

The `next` values are empty since the graph has terminated (transitioned to the
`__end__`).


```typescript
checkpoint.next;
```

    []


## Let's get it to execute a tool

When we call the graph again, it will create a checkpoint after each internal
execution step. Let's get it to run a tool, then look at the checkpoint.


```typescript
inputs = { messages: [["user", "What's the weather like in SF currently?"]] };
for await (
  const { messages } of await graph.stream(inputs, {
    ...config,
    streamMode: "values",
  })
) {
  let msg = messages[messages?.length - 1];
  if (msg?.content) {
    console.log(msg.content);
  } else if (msg?.tool_calls?.length > 0) {
    console.log(msg.tool_calls);
  } else {
    console.log(msg);
  }
  console.log("-----\n");
}
```

    [ [32m'user'[39m, [32m"What's the weather like in SF currently?"[39m ]
    -----
    
    [
      {
        name: [32m'search'[39m,
        args: { query: [32m'current weather in San Francisco'[39m },
        id: [32m'call_3dj210cRFWwO6ZXbKskiXqn6'[39m
      }
    ]
    -----
    
    Cold, with a low of 13 ℃
    -----
    


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    The current weather in San Francisco is 13°C and cold.
    -----
    


See the trace of the above execution here:
https://smith.langchain.com/public/0ef426fd-0da1-4c02-a50b-64ae1e68338e/r We can
see it planned the tool execution (ie the "agent" node), then "should_continue"
edge returned "continue" so we proceeded to "action" node, which executed the
tool, and then "agent" node emitted the final response, which made
"should_continue" edge return "end". Let's see how we can have more control over
this.

### Pause before tools

If you notice below, we now will add `interruptBefore=["action"]` - this means
that before any actions are taken we pause. This is a great moment to allow the
user to correct and update the state! This is very useful when you want to have
a human-in-the-loop to validate (and potentially change) the action to take.


```typescript
memory = new MemorySaver();
const graphWithInterrupt = workflow.compile({
  checkpointer: memory,
  interruptBefore: ["tools"],
});

inputs = { messages: [["user", "What's the weather like in SF currently?"]] };
for await (
  const { messages } of await graphWithInterrupt.stream(inputs, {
    ...config,
    streamMode: "values",
  })
) {
  let msg = messages[messages?.length - 1];
  if (msg?.content) {
    console.log(msg.content);
  } else if (msg?.tool_calls?.length > 0) {
    console.log(msg.tool_calls);
  } else {
    console.log(msg);
  }
  console.log("-----\n");
}
```

    [ [32m'user'[39m, [32m"What's the weather like in SF currently?"[39m ]
    -----
    
    [
      {
        name: [32m'search'[39m,
        args: { query: [32m'current weather in San Francisco'[39m },
        id: [32m'call_WRrsB6evR9HRlKvTpeKdTeMA'[39m
      }
    ]
    -----
    


## Get State

You can fetch the latest graph checkpoint using
[`getState(config)`](https://langchain-ai.github.io/langgraphjs/reference/classes/pregel.Pregel.html#getState).


```typescript
let snapshot = await graphWithInterrupt.getState(config);
snapshot.next;
```

    [ [32m'tools'[39m ]


## Resume

You can resume by running the graph with a `null` input. The checkpoint is
loaded, and with no new inputs, it will execute as if no interrupt had occurred.


```typescript
for await (
  const { messages } of await graphWithInterrupt.stream(null, {
    ...snapshot.config,
    streamMode: "values",
  })
) {
  let msg = messages[messages?.length - 1];
  if (msg?.content) {
    console.log(msg.content);
  } else if (msg?.tool_calls?.length > 0) {
    console.log(msg.tool_calls);
  } else {
    console.log(msg);
  }
  console.log("-----\n");
}
```

    Cold, with a low of 13 ℃
    -----
    


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    The current weather in San Francisco is cold, with a low of 13°C (55°F).
    -----
    


## Check full history

Let's browse the history of this thread, from newest to oldest.



```typescript
let toReplay;
const states = await graphWithInterrupt.getStateHistory(config);
for await (const state of states) {
  console.log(state);
  console.log("--");
  if (state.values?.messages?.length === 2) {
    toReplay = state;
  }
}
```

    {
      values: { messages: [ [36m[Array][39m, [36m[AIMessage][39m, [36m[ToolMessage][39m, [36m[AIMessage][39m ] },
      next: [],
      metadata: { source: [32m'loop'[39m, step: [33m3[39m, writes: { messages: [36m[Array][39m } },
      config: {
        configurable: {
          thread_id: [32m'conversation-num-1'[39m,
          checkpoint_id: [32m'1ef16645-dedc-6920-8003-05dd7bf5a619'[39m
        }
      },
      parentConfig: [90mundefined[39m
    }
    --
    {
      values: { messages: [ [36m[Array][39m, [36m[AIMessage][39m, [36m[ToolMessage][39m ] },
      next: [ [32m'agent'[39m ],
      metadata: { source: [32m'loop'[39m, step: [33m2[39m, writes: { messages: [36m[Array][39m } },
      config: {
        configurable: {
          thread_id: [32m'conversation-num-1'[39m,
          checkpoint_id: [32m'1ef16645-d8d3-6290-8002-acd679142065'[39m
        }
      },
      parentConfig: [90mundefined[39m
    }
    --
    {
      values: { messages: [ [36m[Array][39m, [36m[AIMessage][39m ] },
      next: [ [32m'tools'[39m ],
      metadata: { source: [32m'loop'[39m, step: [33m1[39m, writes: { messages: [36m[Array][39m } },
      config: {
        configurable: {
          thread_id: [32m'conversation-num-1'[39m,
          checkpoint_id: [32m'1ef16645-c45e-6580-8001-3508bcab0211'[39m
        }
      },
      parentConfig: [90mundefined[39m
    }
    --
    {
      values: { messages: [ [36m[Array][39m ] },
      next: [ [32m'agent'[39m ],
      metadata: { source: [32m'loop'[39m, step: [33m0[39m, writes: { messages: [36m[Array][39m } },
      config: {
        configurable: {
          thread_id: [32m'conversation-num-1'[39m,
          checkpoint_id: [32m'1ef16645-be57-6602-8000-da3eed993c02'[39m
        }
      },
      parentConfig: [90mundefined[39m
    }
    --
    {
      values: { messages: [] },
      next: [ [32m'__start__'[39m ],
      metadata: { source: [32m'input'[39m, step: [33m-1[39m, writes: { __start__: [36m[Object][39m } },
      config: {
        configurable: {
          thread_id: [32m'conversation-num-1'[39m,
          checkpoint_id: [32m'1ef16645-be57-6601-unde-finedff5c9266290795'[39m
        }
      },
      parentConfig: [90mundefined[39m
    }
    --


## Replay a past state

To replay from this place we just need to pass its config back to the agent.



```typescript
for await (
  const { messages } of await graphWithInterrupt.stream(null, {
    ...toReplay.config,
    streamMode: "values",
  })
) {
  let msg = messages[messages?.length - 1];
  if (msg?.content) {
    console.log(msg.content);
  } else if (msg?.tool_calls?.length > 0) {
    console.log(msg.tool_calls);
  } else {
    console.log(msg);
  }
  console.log("-----\n");
}
```

    Cold, with a low of 13 ℃
    -----
    


    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    The current weather in San Francisco is cold, with a low of 13°C.
    -----
    


## Branch off a past state

Using LangGraph's checkpointing, you can do more than just replay past states.
You can branch off previous locations to let the agent explore alternate
trajectories or to let a user "version control" changes in a workflow.

#### First, update a previous checkpoint

Updating the state will create a **new** snapshot by applying the update to the
previous checkpoint. Let's **add a tool message** to simulate calling the tool.


```typescript
import { ToolMessage } from "@langchain/core/messages";

const tool_calls =
  toReplay.values.messages[toReplay.values.messages.length - 1].tool_calls;
const branchConfig = await graphWithInterrupt.updateState(
  toReplay.config,
  {
    messages: [
      new ToolMessage("It's sunny out, with a high of 38 ℃.", tool_calls[0].id),
    ],
  },
  // Updates are applied "as if" they were coming from a node. By default,
  // the updates will come from the last node to run. In our case, we want to treat
  // this update as if it came from the tools node, so that the next node to run will be
  // the agent.
  "tools",
);

const branchState = await graphWithInterrupt.getState(branchConfig);
console.log(branchState.values);
console.log(branchState.next);
```

    {
      messages: [
        [ [32m'user'[39m, [32m"What's the weather like in SF currently?"[39m ],
        AIMessage {
          lc_serializable: [33mtrue[39m,
          lc_kwargs: [36m[Object][39m,
          lc_namespace: [36m[Array][39m,
          content: [32m''[39m,
          name: [90mundefined[39m,
          additional_kwargs: [36m[Object][39m,
          response_metadata: [36m[Object][39m,
          tool_calls: [36m[Array][39m,
          invalid_tool_calls: []
        },
        ToolMessage {
          lc_serializable: [33mtrue[39m,
          lc_kwargs: [36m[Object][39m,
          lc_namespace: [36m[Array][39m,
          content: [32m"It's sunny out, with a high of 38 ℃."[39m,
          name: [90mundefined[39m,
          additional_kwargs: {},
          response_metadata: {},
          tool_call_id: [32m'call_WRrsB6evR9HRlKvTpeKdTeMA'[39m
        }
      ]
    }
    [ [32m'agent'[39m ]


#### Now you can run from this branch

Just use the updated config (containing the new checkpoint ID). The trajectory
will follow the new branch.


```typescript
for await (
  const { messages } of await graphWithInterrupt.stream(null, {
    ...branchConfig,
    streamMode: "values",
  })
) {
  let msg = messages[messages?.length - 1];
  if (msg?.content) {
    console.log(msg.content);
  } else if (msg?.tool_calls?.length > 0) {
    console.log(msg.tool_calls);
  } else {
    console.log(msg);
  }
  console.log("-----\n");
}
```

    Skipping write for channel branch:agent:routeMessage:undefined which has no readers


    The current weather in San Francisco is sunny, with a high of 38°C.
    -----
    



```typescript

```
