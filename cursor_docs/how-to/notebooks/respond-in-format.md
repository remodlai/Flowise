# Respond in a format

The typical ReAct agent prompts the LLM to respond in 1 of two formats: a
function call (~ JSON) to use a tool, or conversational text to respond to the
user.

If your agent is connected to a structured (or even generative) UI, or if it is
communicating with another agent or software process, you may want it to resopnd
in a specific structured format.

In this example we will build a conversational ReAct agent that responds in a
specific format. We will do this by using
[tool calling](https://js.langchain.com/docs/modules/model_io/models/chat/function-calling/).
This is useful when you want to enforce that an agent's response is in a
specific format. In this example, we will ask it respond as if it were a
weatherman, returning the temperature and additional info in separate,
machine-readable fields.


## Setup

First we need to install the packages required

```bash
yarn add langchain @langchain/anthropic @langchain/langgraph
```


Next, we need to set API keys for OpenAI (the LLM we will use).



```typescript
// process.env.OPENAI_API_KEY = "sk_...";
```

Optionally, we can set API key for
[LangSmith tracing](https://smith.langchain.com/), which will give us
best-in-class observability.



```typescript
// process.env.LANGCHAIN_API_KEY = "ls...";
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_PROJECT = "Respond in Format: LangGraphJS";
```

    Respond in Format: LangGraphJS


## Set up the State



```typescript
import { BaseMessage } from "@langchain/core/messages";
import { StateGraphArgs } from "@langchain/langgraph";

interface IState {
  messages: BaseMessage[];
}

const graphState: StateGraphArgs<IState>["channels"] = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
};
```

## Set up the tools



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
    // This is a placeholder, but don't tell the LLM that...
    return "The answer to your question lies within.";
  },
});

const tools = [searchTool];
```

We can now wrap these tools in a simple
[ToolNode](https://langchain-ai.github.io/langgraphjs/reference/classes/prebuilt.ToolNode.html).



```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";

const toolNode = new ToolNode<{ messages: BaseMessage[] }>(tools);
```

## Set up the model



```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
});
```

After we've done this, we should make sure the model knows that it has these
tools available to call. We can do this by converting the LangChain tools into
the format for function calling, and then bind them to the model class.

We also want to define a response schema for the language model and bind it to
the model as a function as well.


```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const Response = z.object({
  temperature: z.number().describe("the temperature"),
  other_notes: z.string().describe("any other notes about the weather"),
});

const boundModel = model.bindTools([
  ...tools,
  {
    type: "function",
    function: {
      name: "Response",
      description: "Respond to the user using this tool.",
      parameters: zodToJsonSchema(Response),
    },
  },
]);
```

## Define the nodes



```typescript
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { END } from "@langchain/langgraph";

// Define the function that determines whether to continue or not
const route = (state: IState) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If there is no function call, then we finish
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return END;
  }
  // Otherwise if there is, we need to check what type of function call it is
  if (lastMessage.tool_calls[0].name === "Response") {
    return END;
  }
  // Otherwise we continue
  return "tools";
};

// Define the function that calls the model
const callModel = async (
  state: IState,
  config: RunnableConfig,
) => {
  const { messages } = state;
  const response = await boundModel.invoke(messages, config);
  // We return an object, because this will get added to the existing list
  return { messages: [response] };
};
```

## Define the graph


```typescript
import { END, START, StateGraph } from "@langchain/langgraph";

// Define a new graph
const workflow = new StateGraph<IState>({
  channels: graphState,
})
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges(
    // First, we define the start node. We use `agent`.
    // This means these are the edges taken after the `agent` node is called.
    "agent",
    // Next, we pass in the function that will determine which node is called next.
    route,
    {
      tools: "tools",
      [END]: END,
    },
  )
  // We now add a normal edge from `tools` to `agent`.
  // This means that after `tools` is called, `agent` node is called next.
  .addEdge("tools", "agent");

// Finally, we compile it!
// This compiles it into a LangChain Runnable,
// meaning you can use it as you would any other runnable
const app = workflow.compile();
```

## Use it!

We can now use it! This now exposes the
[same interface](https://v02.api.js.langchain.com/classes/langchain_core_runnables.Runnable.html)
as all other LangChain runnables.



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

const inputs = {
  messages: [new HumanMessage("what is the weather in sf")],
};

for await (const output of await app.stream(inputs, { streamMode: "values" })) {
  const { messages } = output;
  prettyPrint(messages[messages.length - 1]);
  console.log("\n---\n");
}
```

    [human]: what is the weather in sf
    
    ---
    
    [ai]:  
    Tools: 
    - search({"query":"current weather in San Francisco"})
    
    ---
    
    [tool]: The answer to your question lies within.
    
    ---
    
    [ai]:  
    Tools: 
    - Response({"temperature":64,"other_notes":"Partly cloudy with a gentle breeze."})
    
    ---
    


    unknown msg_type: comm_open
    unknown msg_type: comm_msg

