declare const _default: {
    getAllComponentsCredentials: () => Promise<any>;
    getComponentByName: (credentialName: string) => Promise<import("@components/Interface").INode | import("@components/Interface").INode[]>;
    getSingleComponentsCredentialIcon: (credentialName: string) => Promise<string>;
};
export default _default;
