"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_2 = require("../../errors/utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const getAllNodeConfigs = async (requestBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        console.log('========= Start of getAllNodeConfigs =========');
        logger_1.default.debug('========= Start of getAllNodeConfigs =========');
        console.log('requestBody', JSON.stringify(requestBody));
        logger_1.default.debug('requestBody', JSON.stringify(requestBody));
        console.log('========= End of getAllNodeConfigs =========');
        logger_1.default.debug('========= End of getAllNodeConfigs =========');
        const nodes = [{ data: requestBody }];
        const dbResponse = (0, utils_1.findAvailableConfigs)(nodes, appServer.nodesPool.componentCredentials);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodeConfigsService.getAllNodeConfigs - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAllNodeConfigs
};
//# sourceMappingURL=index.js.map