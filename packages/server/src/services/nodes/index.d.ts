declare const _default: {
    getAllNodes: () => Promise<import("@components/Interface").INode[]>;
    getNodeByName: (nodeName: string) => Promise<import("@components/Interface").INode>;
    getSingleNodeIcon: (nodeName: string) => Promise<string>;
    getSingleNodeAsyncOptions: (nodeName: string, requestBody: any) => Promise<any>;
    executeCustomFunction: (requestBody: any) => Promise<any>;
    getAllNodesForCategory: (category: string) => Promise<import("@components/Interface").INode[]>;
};
export default _default;
