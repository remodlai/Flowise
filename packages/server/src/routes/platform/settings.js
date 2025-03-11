"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlatformSetting = exports.updatePlatformSetting = exports.createPlatformSetting = exports.getPlatformSettingByKey = exports.getAllPlatformSettings = void 0;
const supabase_1 = require("../../utils/supabase");
const logger_1 = __importDefault(require("../../utils/logger"));
const http_status_codes_1 = require("http-status-codes");
/**
 * Get all platform settings
 * @param req Request
 * @param res Response
 */
const getAllPlatformSettings = async (req, res) => {
    try {
        console.log('Getting all platform settings...');
        //console.log('Request headers:', req.headers)
        //console.log('Request user:', req.user)
        const { data, error } = await supabase_1.supabase
            .from('platform_settings')
            .select('*')
            .order('key');
        if (error) {
            console.error(`Error getting platform settings: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        console.log('Platform settings retrieved:', data?.length || 0);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: data || []
        });
    }
    catch (error) {
        console.error(`Error getting platform settings: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting platform settings'
        });
    }
};
exports.getAllPlatformSettings = getAllPlatformSettings;
/**
 * Get a platform setting by key
 * @param req Request
 * @param res Response
 */
const getPlatformSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const { data, error } = await supabase_1.supabase
            .from('platform_settings')
            .select('*')
            .eq('key', key)
            .maybeSingle();
        if (error) {
            logger_1.default.error(`Error getting platform setting by key: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        if (!data) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Platform setting with key ${key} not found`
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting platform setting by key: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting platform setting by key'
        });
    }
};
exports.getPlatformSettingByKey = getPlatformSettingByKey;
/**
 * Create a new platform setting
 * @param req Request
 * @param res Response
 */
const createPlatformSetting = async (req, res) => {
    try {
        const { key, value, description, is_encrypted } = req.body;
        if (!key || !value) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Key and value are required'
            });
        }
        // Check if key already exists
        const { data: existingData, error: existingError } = await supabase_1.supabase
            .from('platform_settings')
            .select('id')
            .eq('key', key)
            .maybeSingle();
        if (existingError) {
            logger_1.default.error(`Error checking existing platform setting: ${existingError.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            });
        }
        if (existingData) {
            return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                success: false,
                error: `Platform setting with key ${key} already exists`
            });
        }
        const { data, error } = await supabase_1.supabase
            .from('platform_settings')
            .insert({
            key,
            value,
            description,
            is_encrypted: is_encrypted || false
        })
            .select()
            .single();
        if (error) {
            logger_1.default.error(`Error creating platform setting: ${error.message}`);
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
        logger_1.default.error(`Error creating platform setting: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error creating platform setting'
        });
    }
};
exports.createPlatformSetting = createPlatformSetting;
/**
 * Update a platform setting
 * @param req Request
 * @param res Response
 */
const updatePlatformSetting = async (req, res) => {
    try {
        const { id } = req.params;
        const { key, value, description, is_encrypted } = req.body;
        if (!key || !value) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Key and value are required'
            });
        }
        // Check if setting exists
        const { data: existingData, error: existingError } = await supabase_1.supabase
            .from('platform_settings')
            .select('id')
            .eq('id', id)
            .maybeSingle();
        if (existingError) {
            logger_1.default.error(`Error checking existing platform setting: ${existingError.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            });
        }
        if (!existingData) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Platform setting with id ${id} not found`
            });
        }
        const { data, error } = await supabase_1.supabase
            .from('platform_settings')
            .update({
            key,
            value,
            description,
            is_encrypted: is_encrypted || false,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            logger_1.default.error(`Error updating platform setting: ${error.message}`);
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
        logger_1.default.error(`Error updating platform setting: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error updating platform setting'
        });
    }
};
exports.updatePlatformSetting = updatePlatformSetting;
/**
 * Delete a platform setting
 * @param req Request
 * @param res Response
 */
const deletePlatformSetting = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if setting exists
        const { data: existingData, error: existingError } = await supabase_1.supabase
            .from('platform_settings')
            .select('id')
            .eq('id', id)
            .maybeSingle();
        if (existingError) {
            logger_1.default.error(`Error checking existing platform setting: ${existingError.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            });
        }
        if (!existingData) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Platform setting with id ${id} not found`
            });
        }
        const { error } = await supabase_1.supabase
            .from('platform_settings')
            .delete()
            .eq('id', id);
        if (error) {
            logger_1.default.error(`Error deleting platform setting: ${error.message}`);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Platform setting deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting platform setting: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error deleting platform setting'
        });
    }
};
exports.deletePlatformSetting = deletePlatformSetting;
exports.default = {
    getAllPlatformSettings: exports.getAllPlatformSettings,
    getPlatformSettingByKey: exports.getPlatformSettingByKey,
    createPlatformSetting: exports.createPlatformSetting,
    updatePlatformSetting: exports.updatePlatformSetting,
    deletePlatformSetting: exports.deletePlatformSetting
};
//# sourceMappingURL=settings.js.map