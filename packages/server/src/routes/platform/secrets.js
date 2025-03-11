"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSecret = exports.updateSecret = exports.createSecret = exports.getSecretById = exports.getAllSecrets = void 0;
const supabase_1 = require("../../utils/supabase");
const logger_1 = __importDefault(require("../../utils/logger"));
const http_status_codes_1 = require("http-status-codes");
/**
 * Get all secrets
 * @param req Request
 * @param res Response
 */
const getAllSecrets = async (req, res) => {
    try {
        logger_1.default.info('========= Start of getAllSecrets =========');
        const { data, error } = await supabase_1.supabase
            .from('secrets')
            .select('*')
            .order('name');
        if (error) {
            logger_1.default.error(`Error getting secrets: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: data || []
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting secrets: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting secrets'
        });
    }
};
exports.getAllSecrets = getAllSecrets;
/**
 * Get a secret by ID
 * @param req Request
 * @param res Response
 */
const getSecretById = async (req, res) => {
    try {
        logger_1.default.info('========= Start of getSecretById =========');
        const { id } = req.params;
        const { applicationId } = req.query;
        logger_1.default.info(`Getting secret with ID: ${id}`);
        logger_1.default.info(`Application ID from query: ${applicationId || 'not provided'}`);
        let query = supabase_1.supabase.from('secrets').select('*').eq('id', id);
        // If applicationId is provided, verify that the secret is associated with this application
        if (applicationId) {
            logger_1.default.info(`Checking if secret is associated with application: ${applicationId}`);
            // First check if the secret is directly associated with the application
            const { data: appCredData, error: appCredError } = await supabase_1.supabase
                .from('application_credentials')
                .select('*')
                .eq('credential_id', id)
                .eq('application_id', applicationId)
                .maybeSingle();
            if (appCredError) {
                logger_1.default.error(`Error checking application credentials: ${appCredError.message}`);
                return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    error: appCredError.message
                });
            }
            // If the secret is not associated with this application, return an error
            if (!appCredData) {
                logger_1.default.error(`Secret with ID ${id} is not associated with application ${applicationId}`);
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                    success: false,
                    error: `Secret with ID ${id} not found for application ${applicationId}`
                });
            }
            logger_1.default.info(`Secret is associated with application ${applicationId}`);
        }
        // Now get the actual secret
        const { data, error } = await query.maybeSingle();
        if (error) {
            logger_1.default.error(`Error getting secret by ID: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        if (!data) {
            logger_1.default.error(`Secret with ID ${id} not found`);
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Secret with ID ${id} not found`
            });
        }
        logger_1.default.info(`Successfully retrieved secret with ID: ${id}`);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting secret by ID: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting secret by ID'
        });
    }
};
exports.getSecretById = getSecretById;
/**
 * Create a new secret
 * @param req Request
 * @param res Response
 */
const createSecret = async (req, res) => {
    try {
        logger_1.default.info('========= Start of createSecret =========');
        const { name, type, value, metadata } = req.body;
        if (!name || !value) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Name and value are required'
            });
        }
        const { data, error } = await supabase_1.supabase
            .from('secrets')
            .insert({
            name,
            type: type || 'api_key',
            value,
            metadata: metadata || {}
        })
            .select()
            .single();
        if (error) {
            logger_1.default.error(`Error creating secret: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error(`Error creating secret: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error creating secret'
        });
    }
};
exports.createSecret = createSecret;
/**
 * Update a secret
 * @param req Request
 * @param res Response
 */
const updateSecret = async (req, res) => {
    try {
        logger_1.default.info('========= Start of updateSecret =========');
        const { id } = req.params;
        const { name, type, value, metadata } = req.body;
        if (!name || !value) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Name and value are required'
            });
        }
        // Check if secret exists
        const { data: existingData, error: existingError } = await supabase_1.supabase
            .from('secrets')
            .select('id')
            .eq('id', id)
            .maybeSingle();
        if (existingError) {
            logger_1.default.error(`Error checking existing secret: ${existingError.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            });
        }
        if (!existingData) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Secret with ID ${id} not found`
            });
        }
        const { data, error } = await supabase_1.supabase
            .from('secrets')
            .update({
            name,
            type: type || 'api_key',
            value,
            metadata: metadata || {},
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            logger_1.default.error(`Error updating secret: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating secret: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error updating secret'
        });
    }
};
exports.updateSecret = updateSecret;
/**
 * Delete a secret
 * @param req Request
 * @param res Response
 */
const deleteSecret = async (req, res) => {
    try {
        logger_1.default.info('========= Start of deleteSecret =========');
        const { id } = req.params;
        // Check if secret exists
        const { data: existingData, error: existingError } = await supabase_1.supabase
            .from('secrets')
            .select('id')
            .eq('id', id)
            .maybeSingle();
        if (existingError) {
            logger_1.default.error(`Error checking existing secret: ${existingError.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            });
        }
        if (!existingData) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Secret with ID ${id} not found`
            });
        }
        const { error } = await supabase_1.supabase
            .from('secrets')
            .delete()
            .eq('id', id);
        if (error) {
            logger_1.default.error(`Error deleting secret: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Secret deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting secret: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error deleting secret'
        });
    }
};
exports.deleteSecret = deleteSecret;
exports.default = {
    getAllSecrets: exports.getAllSecrets,
    getSecretById: exports.getSecretById,
    createSecret: exports.createSecret,
    updateSecret: exports.updateSecret,
    deleteSecret: exports.deleteSecret
};
//# sourceMappingURL=secrets.js.map