import client from './client'

/**
 * Get all custom roles
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getAllRoles = (params = {}) => {
    return client.get('/api/v1/custom-roles', { params })
}

/**
 * Get a specific role by ID
 * @param {string} id - Role ID
 * @returns {Promise}
 */
export const getRoleById = (id) => {
    return client.get(`/api/v1/custom-roles/${id}`)
}

/**
 * Create a new custom role
 * @param {Object} roleData - Role data
 * @returns {Promise}
 */
export const createRole = (roleData) => {
    return client.post('/api/v1/custom-roles', roleData)
}

/**
 * Update an existing role
 * @param {string} id - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise}
 */
export const updateRole = (id, roleData) => {
    return client.put(`/api/v1/custom-roles/${id}`, roleData)
}

/**
 * Delete a role
 * @param {string} id - Role ID
 * @returns {Promise}
 */
export const deleteRole = (id) => {
    return client.delete(`/api/v1/custom-roles/${id}`)
}

/**
 * Get permissions for a role
 * @param {string} id - Role ID
 * @returns {Promise}
 */
export const getRolePermissions = (id) => {
    return client.get(`/api/v1/custom-roles/${id}/permissions`)
}

/**
 * Get permissions for a role using direct SQL
 * @param {string} id - Role ID
 * @returns {Promise}
 */
export const getRolePermissionsDirect = (id) => {
    return client.get(`/api/v1/custom-roles/${id}/permissions-direct`)
}

/**
 * Add permissions to a role
 * @param {string} id - Role ID
 * @param {Array} permissions - Array of permission strings
 * @returns {Promise}
 */
export const addRolePermissions = (id, permissions) => {
    return client.post(`/api/v1/custom-roles/${id}/permissions`, { permissions })
}

/**
 * Remove a permission from a role
 * @param {string} id - Role ID
 * @param {string} permission - Permission to remove
 * @returns {Promise}
 */
export const removeRolePermission = (id, permission) => {
    return client.delete(`/api/v1/custom-roles/${id}/permissions/${permission}`)
}

/**
 * Get users assigned to a role
 * @param {string} id - Role ID
 * @returns {Promise}
 */
export const getRoleUsers = (id) => {
    return client.get(`/api/v1/custom-roles/${id}/users`)
}

/**
 * Assign a role to a user
 * @param {string} id - Role ID
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const assignRoleToUser = (id, userId) => {
    return client.post(`/api/v1/custom-roles/${id}/users`, { user_id: userId })
}

/**
 * Remove a role from a user
 * @param {string} id - Role ID
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const removeRoleFromUser = (id, userId) => {
    return client.delete(`/api/v1/custom-roles/${id}/users/${userId}`)
}

/**
 * Get all custom roles for a user
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const getUserRoles = (userId) => {
    return client.get(`/api/v1/users/${userId}/custom-roles`)
}

/**
 * Get all available permissions
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getAllPermissions = (params = {}) => {
    return client.get('/api/v1/permissions', { params })
}

/**
 * Get all permission categories
 * @returns {Promise}
 */
export const getPermissionCategories = () => {
    return client.get('/api/v1/permissions/categories')
}

/**
 * Check if a user has a specific permission
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const checkUserPermission = (params) => {
    return client.get('/api/v1/permissions/check', { params })
} 