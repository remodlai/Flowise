import OpenAI from 'openai';
declare const _default: {
    getAllOpenaiAssistants: (credentialId: string) => Promise<any>;
    getSingleOpenaiAssistant: (credentialId: string, assistantId: string) => Promise<any>;
    uploadFilesToAssistant: (credentialId: string, files: {
        filePath: string;
        fileName: string;
    }[]) => Promise<OpenAI.Files.FileObject[]>;
};
export default _default;
