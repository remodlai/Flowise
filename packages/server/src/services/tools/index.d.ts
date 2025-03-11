import { Tool } from '../../database/entities/Tool';
import { QueryRunner } from 'typeorm';
declare const _default: {
    createTool: (requestBody: any) => Promise<any>;
    deleteTool: (toolId: string, applicationId?: string) => Promise<any>;
    getAllTools: (applicationId?: string) => Promise<Tool[]>;
    getToolById: (toolId: string, applicationId?: string) => Promise<any>;
    updateTool: (toolId: string, toolBody: any) => Promise<any>;
    importTools: (newTools: Partial<Tool>[], queryRunner?: QueryRunner) => Promise<import("typeorm").InsertResult | undefined>;
};
export default _default;
