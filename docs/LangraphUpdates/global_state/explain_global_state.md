**Explaining Global State**

Global state is a way to store data that is shared across all nodes in a graph.

It is useful for storing data that is needed by multiple nodes, such as the state of an agent.

That pattern is a great example of how to define node functions using a strongly typed state. In the snippet you provided:

```typescript
const modelNode = async (state: typeof SubGraphAnnotation.State) => {
  const result = await model.invoke(state.messages);
  return { city: result.city };
};
```

**Here's what’s happening:**

- **Typed State from Annotation:**  
  By writing `state: typeof SubGraphAnnotation.State`, you're leveraging LangGraph's Annotation system to derive the exact state type. This ensures that your node function knows the expected shape of the state (which, in this case, includes fields like `messages` and `city` if you extend it).

- **Typed Input to the Model:**  
  With this approach, `state.messages` is guaranteed to be in the correct format for `model.invoke(...)`. It prevents common bugs that might occur due to type mismatches and makes your node function more self-documenting.

- **Returning Updated State:**  
  In this example, the function returns an object with a `city` property (extracted from the model's result). This return value can then be used to update the state, either immediately or passed to subsequent nodes in your StateGraph.

**Usage in a global or agent subgraph:**  
You can adopt this pattern across your agent nodes. For example, if you define your global state with an extended annotation (like adding a `bike` field), you can later define nodes that consume the state like so:

A simple solution is to create a dedicated module for your global state. For example:

```typescript
// globalState.ts
import { Annotation, StateGraph, MessagesAnnotation } from "@langchain/langgraph";

// Extend the base annotation with additional fields (for example, "bike")
export const GlobalAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  bike: Annotation<string>({
    default: () => "default bike spec"
  })
});

// Optionally export a global state graph using that annotation
export const globalStateGraph = new StateGraph(GlobalAnnotation)
// You can add or configure nodes as needed, for example:
//   .addNode("myNode", myNodeHandler)
//   .addEdge("__start__", "myNode")
//   .compile({ interruptBefore: ["myOtherNode"] });
```

This pattern makes it easy to create and chain transformations on a shared state that’s strongly typed according to your LangGraph annotations.

In summary, adopting this pattern improves type safety, ensures consistency across your subgraph, and makes it clear what data each node depends on. It fits perfectly within the LangGraph approach for creating modular, self-contained agent subgraphs.


Then, in both your sequential agent nodes and in buildAgentGraph.ts, you can import and use this global state:

```typescript
// Example usage in buildAgentGraph.ts
import { globalStateGraph, GlobalAnnotation } from "./globalState";

// You can now refer to globalStateGraph or even GlobalAnnotation.State for typing.
// For instance, when building conditional routes:
const routeMessage = (state: typeof GlobalAnnotation.State) => {
  // Access your extended state, like bike specification.
  console.log("Bike Spec:", state.bike);
  // process messages (using state.messages) and decide next node...
  return state.messages.length ? "nextNode" : "END";
};

globalStateGraph.addConditionalEdges("sourceNode", routeMessage);
```

This approach provides a clear, type-safe way to manage shared state across your agent subgraph, ensuring consistency and type safety.

    That pattern is a great example of how to define node functions using a strongly typed state. In the snippet you provided:

```typescript
const modelNode = async (state: typeof SubGraphAnnotation.State) => {
  const result = await model.invoke(state.messages);
  return { city: result.city };
};
```


**Here's what’s happening:**

- **Typed State from Annotation:**  
  By writing `state: typeof SubGraphAnnotation.State`, you're leveraging LangGraph's Annotation system to derive the exact state type. This ensures that your node function knows the expected shape of the state (which, in this case, includes fields like `messages` and `city` if you extend it).

- **Typed Input to the Model:**  
  With this approach, `state.messages` is guaranteed to be in the correct format for `model.invoke(...)`. It prevents common bugs that might occur due to type mismatches and makes your node function more self-documenting.

- **Returning Updated State:**  
  In this example, the function returns an object with a `city` property (extracted from the model's result). This return value can then be used to update the state, either immediately or passed to subsequent nodes in your StateGraph.

**Usage in a global or agent subgraph:**  
You can adopt this pattern across your agent nodes. For example, if you define your global state with an extended annotation (like adding a `bike` field), you can later define nodes that consume the state like so:

A simple solution is to create a dedicated module for your global state. For example:

```typescript
// globalState.ts   
// An extended global annotation
const GlobalAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  bike: Annotation<string>({
    default: () => "default bike spec"
  })
});

// A node function using the global state type
const bikeNode = async (state: typeof GlobalAnnotation.State) => {
  // Access both messages and bike fields in a type-safe manner.
  console.log("Bike spec is:", state.bike);
  // You can process the state or update it as needed.
  // For example, return an updated value for bike:
  return { bike: state.bike + " - updated" };
};
```

This pattern makes it easy to create and chain transformations on a shared state that’s strongly typed according to your LangGraph annotations.

In summary, adopting this pattern improves type safety, ensures consistency across your subgraph, and makes it clear what data each node depends on. It fits perfectly within the LangGraph approach for creating modular, self-contained agent subgraphs.


```typescript
import { MessageAnnotation } from '@langchain/langgraph'

// Extend the global variable declaration to include bikeAnnotation
declare global {
  var langgraphState: {
    messages: typeof MessageAnnotation;
    state: Record<string, any>;
    bikeAnnotation?: {
      spec: string;
      // ...other properties if needed
    }
  } | undefined;
}

// Initialize the global LangGraph state if it doesn't exist.
if (!globalThis.langgraphState) {
  globalThis.langgraphState = {
    messages: MessageAnnotation,
    state: {},
    bikeAnnotation: { spec: 'default bike spec' } // Initialize as needed.
  }
}

export const globalLanggraphState = globalThis.langgraphState;
```

This pattern provides a clear, type-safe way to manage global state across your LangGraph subgraphs, ensuring consistency and type safety.



Then, in any other module (e.g., within your sequential agents or in `buildAgentGraph.ts`), you can import and use it like so:

```typescript
import { globalLanggraphState } from './globalLanggraphState';

function useBikeAnnotation() {
  // Access bikeAnnotation.spec from the global state:
  const spec = globalLanggraphState.bikeAnnotation?.spec;
  console.log("Bike specification:", spec);
}

useBikeAnnotation();
```

This pattern provides a clear, type-safe way to manage global state across your LangGraph subgraphs, ensuring consistency and type safety.


**UPDATING STATE**
You update the state in LangGraph by returning an object containing the updated properties from your node function. When your node returns an object (with keys matching your annotation’s fields), LangGraph’s reducer merges those changes with the incoming state before passing it to the next node.

```typescript
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// Define a global annotation with additional fields.
export const GlobalAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  bike: Annotation<string>({
    default: () => "default bike spec"
  }),
  city: Annotation<string>()
});
```
You can update state as follows:
```typescript
const updateCityNode = async (
  state: typeof GlobalAnnotation.State
): Promise<Partial<typeof GlobalAnnotation.State>> => {
  // Compute the new value—this could be from an LLM response or any other logic.
  const newCity = "New York";
  // By returning an object with a "city" property, LangGraph merges it into the current state.
  return { city: newCity };
};

const updateBikeNode = async (
  state: typeof GlobalAnnotation.State  
): Promise<Partial<typeof GlobalAnnotation.State>> => {
  // For instance, update the "bike" field by appending some text.
  return { bike: state.bike + " - updated" };
};
```

Each node receives the current state and, by returning an object with the fields you want to update, you effectively modify the state. The underlying reducer (configured when creating your StateGraph via your annotation) automatically merges these returned objects into the running state, making the updates available for subsequent nodes in the graph.


**Partial "casting" of state**

Below is an example of how you can "project" only specific global state properties into a subgraph by reusing parts of your global annotation's `.spec`. In your subgraph, you can define a new annotation that references only the fields you want to work with—for example, using the TypeScript `Pick` operator or by manually copying over selected fields.

```typescript
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GlobalAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  bike: Annotation<string>({
    default: () => "default bike spec"
  }),
  city: Annotation<string>()
});```


You can create a subgraph annotation that only cares about, say, city and messages by doing:import { GlobalAnnotation } from 
```typescript
"./globalState";
import { Annotation } from "@langchain/langgraph";

// Option 1: Manually create a new annotation referencing parts of GlobalAnnotation.spec
export const SubGraphAnnotation = Annotation.Root({
  messages: GlobalAnnotation.spec.messages,
  city: GlobalAnnotation.spec.city,
});

// Option 2: Using TypeScript's Pick utility to type the state in a node function
type SubState = Pick<typeof GlobalAnnotation.State, "messages" | "city">;

const modelNode = async (state: SubState) => {
  // Now 'state' only has "messages" and "city"
  const result = await model.invoke(state.messages);
  return { city: result.city };
};```


In this way, your subgraph only "casts in" (or works with) the selected state values from your global state. This keeps your node functions type-safe while allowing you to work with a more focused slice of your application's shared state.