import { IApplication } from '../../Interface';
declare const _default: {
    getApplicationIdForChatflow: (chatflowId: string) => Promise<string | null>;
    getChatflowIdsForApplication: (applicationId: string) => Promise<string[]>;
    associateChatflowWithApplication: (chatflowId: string, applicationId: string, folderPath?: string) => Promise<boolean>;
    removeChatflowAssociation: (chatflowId: string) => Promise<boolean>;
    getDefaultApplicationId: () => Promise<string | null>;
    getUserApplications: (userId: string) => Promise<IApplication[]>;
    isUserPlatformAdmin: (userId: string) => Promise<boolean>;
};
export default _default;
