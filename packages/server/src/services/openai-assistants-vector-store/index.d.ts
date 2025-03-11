import OpenAI from 'openai';
declare const _default: {
    getAssistantVectorStore: (credentialId: string, vectorStoreId: string) => Promise<OpenAI.Beta.VectorStores.VectorStore>;
    listAssistantVectorStore: (credentialId: string) => Promise<OpenAI.Beta.VectorStores.VectorStore[]>;
    createAssistantVectorStore: (credentialId: string, obj: OpenAI.Beta.VectorStores.VectorStoreCreateParams) => Promise<OpenAI.Beta.VectorStores.VectorStore>;
    updateAssistantVectorStore: (credentialId: string, vectorStoreId: string, obj: OpenAI.Beta.VectorStores.VectorStoreUpdateParams) => Promise<OpenAI.Beta.VectorStores.VectorStore>;
    deleteAssistantVectorStore: (credentialId: string, vectorStoreId: string) => Promise<OpenAI.Beta.VectorStores.VectorStoreDeleted>;
    uploadFilesToAssistantVectorStore: (credentialId: string, vectorStoreId: string, files: {
        filePath: string;
        fileName: string;
    }[]) => Promise<any>;
    deleteFilesFromAssistantVectorStore: (credentialId: string, vectorStoreId: string, file_ids: string[]) => Promise<{
        deletedFileIds: string[];
        count: number;
    }>;
};
export default _default;
