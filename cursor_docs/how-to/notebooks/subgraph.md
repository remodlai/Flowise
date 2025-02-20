# Subgraphs

Graphs such as
[StateGraph](https://langchain-ai.github.io/langgraphjs/reference/classes/index.StateGraph.html)'s
naturally can be composed. Creating subgraphs lets you build things like
[multi-agent teams](./multi_agent/hierarchical_agent_teams.ipynb), where each
team can track its own separate state.

You can add a `StateGraph` instance as a node by first
[compiling](https://langchain-ai.github.io/langgraphjs/reference/classes/index.StateGraph.html#compile)
it to translate it to its lower-level Pregel operations.

The main thing you should note is ensuring the "handoff" from the calling graph
to the called graph behaves as expected.

Below are a couple of examples showing how to do so!

## Setup

First, install LangGraph.

```bash
yarn add langraph
```

Optionally, we can set API key for
[LangSmith tracing](https://smith.langchain.com/), which will give us
best-in-class observability.


```typescript
// process.env.OPENAI_API_KEY = "sk_...";

// Optional, add tracing in LangSmith
// process.env.LANGCHAIN_API_KEY = "ls__...";
// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_PROJECT = "Configuration: LangGraphJS";
```

    Configuration: LangGraphJS


## Create Parent + Child Graphs

For this example, we will create two graphs: a parent graph with a few nodes,
and a child graph that is added as a node in the parent.

For this example we will use the same `State` in both graphs, though we will
show how using the same keys can be a stumbling block if you're not careful.


```typescript
import { END, START, StateGraph } from "@langchain/langgraph";
import { StateGraphArgs } from "@langchain/langgraph";

function reduceList(
  left?: string[] | string,
  right?: string[] | string,
): string[] {
  if (!left) {
    left = [];
  } else if (typeof left === "string") {
    left = [left];
  }
  if (!right) {
    right = [];
  } else if (typeof right === "string") {
    right = [right];
  }
  return [...left, ...right];
}

// Define the state type
interface IState {
  name: string;
  path: string[];
}

const graphState: StateGraphArgs<IState>["channels"] = {
  name: {
    // Overwrite name if a new one is provided
    value: (x: string, y?: string) => (y ? y : x),
    default: () => "default",
  },
  path: {
    // Concatenate paths
    value: reduceList,
    default: () => [],
  },
};

const childBuilder = new StateGraph<IState>({ channels: graphState });
childBuilder
  .addNode("child_start", (state) => ({ path: ["child_start"] }))
  .addEdge(START, "child_start")
  .addNode("child_middle", (state) => ({ path: ["child_middle"] }))
  .addNode("child_end", (state) => ({ path: ["child_end"] }))
  .addEdge("child_start", "child_middle")
  .addEdge("child_middle", "child_end")
  .addEdge("child_end", END);

const builder = new StateGraph<IState>({
  channels: graphState,
});

builder
  .addNode("grandparent", (state) => ({ path: ["grandparent"] }))
  .addEdge(START, "grandparent")
  .addNode("parent", (state) => ({ path: ["parent"] }))
  .addNode("child", childBuilder.compile())
  .addNode("sibling", (state) => ({ path: ["sibling"] }))
  .addNode("fin", (state) => ({ path: ["fin"] }))
  // Add connections
  .addEdge("grandparent", "parent")
  .addEdge("parent", "child")
  .addEdge("parent", "sibling")
  .addEdge("child", "fin")
  .addEdge("sibling", "fin")
  .addEdge("fin", END);

const graph = builder.compile();

const result1 = await graph.invoke({ name: "test" });
console.log(result1);
```

    [WARN]: You have enabled LangSmith tracing without backgrounding callbacks.
    [WARN]: If you are not using a serverless environment where you must wait for tracing calls to finish,
    [WARN]: we suggest setting "process.env.LANGCHAIN_CALLBACKS_BACKGROUND=true" to avoid additional latency.


    {
      name: [32m'test'[39m,
      path: [
        [32m'grandparent'[39m,
        [32m'parent'[39m,
        [32m'grandparent'[39m,
        [32m'parent'[39m,
        [32m'child_start'[39m,
        [32m'child_middle'[39m,
        [32m'child_end'[39m,
        [32m'sibling'[39m,
        [32m'fin'[39m
      ]
    }


Notice here that the `["grandparent", "parent"]` sequence is duplicated! This is
because our child state has received the full parent state and returns the full
parent state once it terminates. In the next section, we will show how you can
merge or separate state within nested graphs.

## State handoff

To avoid duplication or conflicts in state, you typically would do one or more
of the following:

1. Handle duplicates in your `reducer` function.
2. Call the child graph from within a TypeScript function. In that function,
   handle the state as needed.
3. Update the child graph keys to avoid conflicts. You would still need to
   ensure the output can be interpreted by the parent, however.

Let's re-implement the graph using technique (1) and add unique IDs for every
value in the list.


```typescript
import { v4 as uuidv4 } from "uuid";

type ValWithId = { id?: string; val: string };

function reduceListWithIds(
  left?: ValWithId[] | ValWithId,
  right?: ValWithId[] | ValWithId,
): any[] {
  /**
   * Append the right-hand list, replacing any elements with the same id in the left-hand list.
   */
  if (!left) {
    left = [];
  } else if (!Array.isArray(left)) {
    left = [left];
  }
  if (!right) {
    right = [];
  } else if (!Array.isArray(right)) {
    right = [right];
  }
  // Ensure there's an id for each element
  const [left_, right_] = [left, right].map((orig) =>
    orig.map((val) => {
      if (!val?.id) {
        val.id = uuidv4();
      }
      return val;
    })
  );

  // Merge the two lists
  const leftIdxById = left_.reduce(
    (acc, val, i) => ({ ...acc, [val.id as string]: i }),
    {} as Record<string, number>,
  );
  const merged = [...left_];
  for (const val of right_) {
    const existingIdx = leftIdxById[val.id as string];
    if (existingIdx !== undefined) {
      merged[existingIdx] = val;
    } else {
      merged.push(val);
    }
  }
  return merged;
}

interface IStateWithIds {
  name: string;
  path: ValWithId[];
}

const graphState2: StateGraphArgs<IStateWithIds>["channels"] = {
  name: {
    // Overwrite name if a new one is provided
    value: (x: string, y?: string) => (y ? y : x),
    default: () => "default",
  },
  path: {
    // Concatenate paths
    value: reduceListWithIds,
    default: () => [],
  },
};

const childBuilderWithIds = new StateGraph<IStateWithIds>({
  channels: graphState2,
});

childBuilderWithIds
  .addNode("child_start", (state) => ({
    path: [{ val: "child_start" }],
  }))
  .addEdge(START, "child_start")
  .addNode("child_middle", (state) => ({
    path: [{ val: "child_middle" }],
  }))
  .addNode("child_end", (state) => ({
    path: [{ val: "child_end" }],
  }))
  .addEdge("child_start", "child_middle")
  .addEdge("child_middle", "child_end")
  .addEdge("child_end", END);

const builderWithIds = new StateGraph<IStateWithIds>({
  channels: graphState2,
});

builderWithIds
  .addNode("grandparent", (state) => ({
    path: [{ val: "grandparent" }],
  }))
  .addEdge(START, "grandparent")
  .addNode("parent", (state) => ({ path: [{ val: "parent" }] }))
  .addNode("child", childBuilderWithIds.compile())
  .addNode("sibling", (state) => ({ path: [{ val: "sibling" }] }))
  .addNode("fin", (state) => ({ path: [{ val: "fin" }] }))
  // Add connections
  .addEdge("grandparent", "parent")
  .addEdge("parent", "child")
  .addEdge("parent", "sibling")
  .addEdge("child", "fin")
  .addEdge("sibling", "fin")
  .addEdge("fin", END);

const graphWithIds = builderWithIds.compile();

const result2 = await graphWithIds.invoke({ name: "test" });
console.log(result2);
```

Duplicates are gone!

```
```
