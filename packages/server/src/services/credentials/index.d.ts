declare const _default: {
    createCredential: (requestBody: any, req?: any) => Promise<{
        id: string;
        name: any;
        credentialName: any;
        encryptedData: string;
        updatedDate: Date;
        createdDate: Date;
    }>;
    deleteCredentials: (credentialId: string, req?: any) => Promise<any>;
    getAllCredentials: (paramCredentialName: any, req?: any) => Promise<{
        id: any;
        name: any;
        credentialName: any;
        applicationId: any;
        encryptedData: any;
        updatedDate: Date;
        createdDate: Date;
    }[]>;
    getCredentialById: (credentialId: string, req?: any) => Promise<any>;
    updateCredential: (credentialId: string, requestBody: any, req?: any) => Promise<any>;
};
export default _default;
