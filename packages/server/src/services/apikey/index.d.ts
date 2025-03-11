declare const _default: {
    getAllApiKeys: (req?: any) => Promise<any>;
    getApiKey: (apiKey: string, req?: any) => Promise<{
        id: string;
        apiKey: string;
        apiSecret: any;
        keyName: any;
        applicationId: any;
    } | undefined>;
    createApiKey: (keyName: string, req?: any) => Promise<any>;
    updateApiKey: (id: string, keyName: string, req?: any) => Promise<any>;
    deleteApiKey: (id: string, req?: any) => Promise<any>;
    importKeys: (body: any) => Promise<any>;
    verifyApiKey: (paramApiKey: string, req?: any) => Promise<string>;
};
export default _default;
