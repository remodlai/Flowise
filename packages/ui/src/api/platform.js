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