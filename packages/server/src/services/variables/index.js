"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Variable_1 = require("../../database/entities/Variable");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const createVariable = async (newVariable) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const variable = await appServer.AppDataSource.getRepository(Variable_1.Variable).create(newVariable);
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).save(variable);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.createVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteVariable = async (variableId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).delete({ id: variableId });
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.deleteVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllVariables = async () => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).find();
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.getAllVariables - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getVariableById = async (variableId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).findOneBy({
            id: variableId
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.getVariableById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateVariable = async (variable, updatedVariable) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const tmpUpdatedVariable = await appServer.AppDataSource.getRepository(Variable_1.Variable).merge(variable, updatedVariable);
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).save(tmpUpdatedVariable);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.updateVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importVariables = async (newVariables, queryRunner) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repository = queryRunner ? queryRunner.manager.getRepository(Variable_1.Variable) : appServer.AppDataSource.getRepository(Variable_1.Variable);
        // step 1 - check whether array is zero
        if (newVariables.length == 0)
            return;
        // step 2 - check whether ids are duplicate in database
        let ids = '(';
        let count = 0;
        const lastCount = newVariables.length - 1;
        newVariables.forEach((newVariable) => {
            ids += `'${newVariable.id}'`;
            if (lastCount != count)
                ids += ',';
            if (lastCount == count)
                ids += ')';
            count += 1;
        });
        const selectResponse = await repository.createQueryBuilder('v').select('v.id').where(`v.id IN ${ids}`).getMany();
        const foundIds = selectResponse.map((response) => {
            return response.id;
        });
        // step 3 - remove ids that are only duplicate
        const prepVariables = newVariables.map((newVariable) => {
            let id = '';
            if (newVariable.id)
                id = newVariable.id;
            if (foundIds.includes(id)) {
                newVariable.id = undefined;
                newVariable.name += ' (1)';
            }
            return newVariable;
        });
        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepVariables);
        return insertResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variableService.importVariables - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createVariable,
    deleteVariable,
    getAllVariables,
    getVariableById,
    updateVariable,
    importVariables
};
//# sourceMappingURL=index.js.map