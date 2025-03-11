"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const secrets_1 = require("../../services/secrets");
const logger_1 = __importDefault(require("../../utils/logger"));
const http_status_codes_1 = require("http-status-codes");
const router = express_1.default.Router();
/**
 * Get a secret by ID
 * This endpoint is used by the components package to retrieve credential data
 * No authentication is required as this is called internally by the components
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { applicationId } = req.query;
        logger_1.default.debug(`========= Start of GET /api/v1/secrets/:id endpoint =========`);
        logger_1.default.debug(`Secret ID: ${id}`);
        logger_1.default.debug(`Application ID from query: ${applicationId || 'not provided'}`);
        logger_1.default.debug(`All query parameters: ${JSON.stringify(req.query)}`);
        if (!id) {
            logger_1.default.debug(`Error: Secret ID is required`);
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Secret ID is required'
            });
        }
        // Get the secret from Supabase, passing the applicationId if provided
        logger_1.default.debug(`Calling getSecret with ID: ${id} and applicationId: ${applicationId || 'not provided'}`);
        const data = await (0, secrets_1.getSecret)(id, applicationId);
        logger_1.default.debug(`getSecret returned data: ${data ? 'data received' : 'no data'}`);
        logger_1.default.debug(`Returning success response`);
        logger_1.default.debug(`========= End of GET /api/v1/secrets/:id endpoint =========`);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting secret by ID: ${error}`);
        logger_1.default.debug(`Error stack: ${error.stack}`);
        logger_1.default.debug(`========= End of GET /api/v1/secrets/:id endpoint with error =========`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting secret by ID'
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map