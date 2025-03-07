import client from './client'

/**
 * Get all organizations
 * @returns {Promise}
 */
export const getAllOrganizations = () => {
    return client.get('/api/v1/organizations')
}

/**
 * Get a specific organization by ID
 * @param {string} id - Organization ID
 * @returns {Promise}
 */
export const getOrganizationById = (id) => {
    return client.get(`/api/v1/organizations/${id}`)
}

/**
 * Create a new organization
 * @param {Object} organizationData - Organization data
 * @returns {Promise}
 */
export const createOrganization = (organizationData) => {
    return client.post('/api/v1/organizations', organizationData)
}

/**
 * Update an existing organization
 * @param {string} id - Organization ID
 * @param {Object} organizationData - Organization data
 * @returns {Promise}
 */
export const updateOrganization = (id, organizationData) => {
    return client.put(`/api/v1/organizations/${id}`, organizationData)
}

/**
 * Delete an organization
 * @param {string} id - Organization ID
 * @returns {Promise}
 */
export const deleteOrganization = (id) => {
    return client.delete(`/api/v1/organizations/${id}`)
}

/**
 * Get members of an organization
 * @param {string} id - Organization ID
 * @returns {Promise}
 */
export const getOrganizationMembers = (id) => {
    return client.get(`/api/v1/organizations/${id}/members`)
}

/**
 * Add a member to an organization
 * @param {string} id - Organization ID
 * @param {Object} memberData - Member data (email, role)
 * @returns {Promise}
 */
export const addOrganizationMember = (id, memberData) => {
    return client.post(`/api/v1/organizations/${id}/members`, memberData)
}

/**
 * Update a member's role in an organization
 * @param {string} id - Organization ID
 * @param {string} userId - User ID
 * @param {Object} memberData - Member data (role)
 * @returns {Promise}
 */
export const updateOrganizationMember = (id, userId, memberData) => {
    return client.put(`/api/v1/organizations/${id}/members/${userId}`, memberData)
}

/**
 * Remove a member from an organization
 * @param {string} id - Organization ID
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const removeOrganizationMember = (id, userId) => {
    return client.delete(`/api/v1/organizations/${id}/members/${userId}`)
} 