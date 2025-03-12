import client from './client'

/**
 * Get all nodes with their enabled status
 * @returns {Promise<Array>} Array of nodes with enabled status
 */
export const getNodesWithEnabledStatus = () => client.get('/platform/nodes')

/**
 * Toggle node enabled status
 * @param {string} nodeType - The type of node to toggle
 * @param {boolean} enabled - Whether the node should be enabled
 * @returns {Promise<Object>} Result of the operation
 */
export const toggleNodeEnabled = (nodeType, enabled) => client.post('/platform/nodes/toggle', { nodeType, enabled })

/**
 * Get all tools with their enabled status
 * @returns {Promise<Array>} Array of tools with enabled status
 */
export const getToolsWithEnabledStatus = () => client.get('/platform/tools')

/**
 * Toggle tool enabled status
 * @param {string} toolType - The type of tool to toggle
 * @param {boolean} enabled - Whether the tool should be enabled
 * @returns {Promise<Object>} Result of the operation
 */
export const toggleToolEnabled = (toolType, enabled) => client.post('/platform/tools/toggle', { toolType, enabled })

// Platform Settings API

/**
 * Get all platform settings
 * @returns {Promise}
 */
export const getPlatformSettings = () => {
    return client.get('/platform/settings')
}

/**
 * Get a platform setting by key
 * @param {string} key - The setting key
 * @returns {Promise}
 */
export const getPlatformSettingByKey = (key) => {
    return client.get(`/platform/settings/${key}`)
}

/**
 * Create a new platform setting
 * @param {Object} setting - The setting object
 * @returns {Promise}
 */
export const createPlatformSetting = (setting) => {
    return client.post('/platform/settings', setting)
}

/**
 * Update a platform setting
 * @param {string} id - The setting ID
 * @param {Object} setting - The updated setting object
 * @returns {Promise}
 */
export const updatePlatformSetting = (id, setting) => {
    return client.put(`/platform/settings/${id}`, setting)
}

/**
 * Delete a platform setting
 * @param {string} id - The setting ID
 * @returns {Promise}
 */
export const deletePlatformSetting = (id) => {
    return client.delete(`/platform/settings/${id}`)
}

// Secrets API

/**
 * Get all secrets
 * @returns {Promise}
 */
export const getSecrets = () => {
    return client.get('/platform/secrets')
}

/**
 * Get a secret by ID
 * @param {string} id - The secret ID
 * @returns {Promise}
 */
export const getSecretById = (id) => {
    return client.get(`/platform/secrets/${id}`)
}

/**
 * Create a new secret
 * @param {Object} secret - The secret object
 * @returns {Promise}
 */
export const createSecret = (secret) => {
    return client.post('/platform/secrets', secret)
}

/**
 * Update a secret
 * @param {string} id - The secret ID
 * @param {Object} secret - The updated secret object
 * @returns {Promise}
 */
export const updateSecret = (id, secret) => {
    return client.put(`/platform/secrets/${id}`, secret)
}

/**
 * Delete a secret
 * @param {string} id - The secret ID
 * @returns {Promise}
 */
export const deleteSecret = (id) => {
    return client.delete(`/platform/secrets/${id}`)
}

/**
 * Test endpoint
 * @returns {Promise}
 */
export const testPlatformEndpoint = () => {
    return client.get('/platform/test')
}

// Platform Assets API

/**
 * List all platform images
 * @param {Object} options - Optional query parameters
 * @param {boolean} options.includeDeleted - Whether to include deleted images (admin only)
 * @param {string} options.contextType - Filter by context type
 * @param {string} options.contextId - Filter by context ID
 * @returns {Promise} - List of images
 */
export const listPlatformImages = (options = {}) => {
    return client.get('/platform/assets/images', { params: options })
}

/**
 * Get a platform image by ID
 * @param {string} id - The image ID
 * @returns {Promise} - Image details
 */
export const getPlatformImage = (id) => {
    return client.get(`/platform/assets/images/${id}`)
}

/**
 * Upload a platform image
 * @param {FormData} formData - Form data with the image file and metadata
 * @returns {Promise} - Upload result
 */
export const uploadPlatformImage = (formData) => {
    return client.post('/platform/assets/images/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * Update a platform image
 * @param {string} id - The image ID
 * @param {Object} data - The updated image data
 * @returns {Promise} - Update result
 */
export const updatePlatformImage = (id, data) => {
    return client.put(`/platform/assets/images/${id}`, data)
}

/**
 * Soft delete a platform image
 * @param {string} id - The image ID
 * @returns {Promise} - Delete result
 */
export const deletePlatformImage = (id) => {
    return client.delete(`/platform/assets/images/${id}`)
}

/**
 * Restore a soft-deleted platform image
 * @param {string} id - The image ID
 * @returns {Promise} - Restore result
 */
export const restorePlatformImage = (id) => {
    return client.post(`/platform/assets/images/${id}/restore`)
}

/**
 * Get the public URL for a platform image
 * @param {string} id - The image ID
 * @returns {Promise} - URL result
 */
export const getPlatformImageUrl = (id) => {
    return client.get(`/platform/assets/images/${id}/url`)
}

/**
 * Get the direct content URL for a platform image
 * @param {string} id - The image ID
 * @returns {string} - Direct content URL
 */
export const getPlatformImageContentUrl = (id) => {
    return `${client.defaults.baseURL}/platform/assets/images/${id}/content`
}

export default {
    getPlatformSettings,
    getPlatformSettingByKey,
    createPlatformSetting,
    updatePlatformSetting,
    deletePlatformSetting,
    getSecrets,
    getSecretById,
    createSecret,
    updateSecret,
    deleteSecret,
    testPlatformEndpoint,
    // Platform Assets
    listPlatformImages,
    getPlatformImage,
    uploadPlatformImage,
    updatePlatformImage,
    deletePlatformImage,
    restorePlatformImage,
    getPlatformImageUrl,
    getPlatformImageContentUrl
} 