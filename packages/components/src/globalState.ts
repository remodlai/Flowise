import { Annotation, MessagesAnnotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { channelValueReducer } from "./Interface";
/*
There is an inherent flaw in the way that Flowise has historically handled state for LangGraph-based agents (E.g. Sequential Agents).
The reason was due to extremely outdated and complex patterns based on legacy deprecated patterns.
While impressive, as they did replicate certain modern patterns, they are extremely complex and difficult to understand.

A major issue when migrating to modern LangGraph patterns is that the state is not easily accessible for the nodes that need it.

This is why we have created a new global state management system that is more intuitive and easier to understand.
*/

//here we define our global state. This represents the state of the entire application.
//It is used to store data that is shared across all nodes in the application.
//It is also used to store data that is needed by multiple nodes, such as the state of an agent.
//It is also used to store data that is needed by multiple nodes, such as the state of an agent.

export const GlobalAnnotation = Annotation.Root({
    messages:  Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => []
    }),
    flow: Annotation<Record<string, any>>({
        reducer: (_, x) => ({ ..._, ...x }),
        default: () => ({})
    }),
    uiState: Annotation<Record<string, any>>({
        reducer: channelValueReducer,
        default: () => ({})
    }),
    memories: Annotation<Record<string, any>>({
        reducer: (_, x) => ({ ..._, ...x }),
        default: () => ({})
    }),
    state: Annotation<Record<string, any>>({
        reducer: channelValueReducer,
        default: () => ({})
    })
})