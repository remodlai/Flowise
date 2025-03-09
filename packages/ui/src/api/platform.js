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
    testPlatformEndpoint
} 