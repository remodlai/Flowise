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