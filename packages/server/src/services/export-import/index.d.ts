import { ChatFlow } from '../../database/entities/ChatFlow';
import { Tool } from '../../database/entities/Tool';
import { Variable } from '../../database/entities/Variable';
import { Assistant } from '../../database/entities/Assistant';
type ExportInput = {
    tool: boolean;
    chatflow: boolean;
    agentflow: boolean;
    variable: boolean;
    assistant: boolean;
};
type ExportData = {
    Tool: Tool[];
    ChatFlow: ChatFlow[];
    AgentFlow: ChatFlow[];
    Variable: Variable[];
    Assistant: Assistant[];
};
declare const _default: {
    convertExportInput: (body: any) => ExportInput;
    exportData: (exportInput: ExportInput) => Promise<{
        FileDefaultName: string;
    } & ExportData>;
    importData: (importData: ExportData) => Promise<void>;
};
export default _default;
