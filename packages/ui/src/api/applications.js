import client from './client'

/**
 * Get all applications
 * @returns {Promise}
 */
export const getAllApplications = () => {
    return client.get('/api/v1/applications')
}

/**
 * Get a specific application by ID
 * @param {string} id - Application ID
 * @returns {Promise}
 */
export const getApplicationById = (id) => {
    return client.get(`/api/v1/applications/${id}`)
}

/**
 * Create a new application
 * @param {Object} applicationData - Application data
 * @returns {Promise}
 */
export const createApplication = (applicationData) => {
    return client.post('/api/v1/applications', applicationData)
}

/**
 * Update an existing application
 * @param {string} id - Application ID
 * @param {Object} applicationData - Application data
 * @returns {Promise}
 */
export const updateApplication = (id, applicationData) => {
    return client.put(`/api/v1/applications/${id}`, applicationData)
}

/**
 * Delete an application
 * @param {string} id - Application ID
 * @returns {Promise}
 */
export const deleteApplication = (id) => {
    return client.delete(`/api/v1/applications/${id}`)
} 