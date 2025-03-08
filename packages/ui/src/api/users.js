import client from './client'

/**
 * Get all users
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getAllUsers = (params = {}) => {
    console.log('API call: getAllUsers with params:', params)
    console.log('Application ID:', localStorage.getItem('selectedApplicationId'))
    console.log('Access token:', localStorage.getItem('access_token') ? 'Present' : 'Missing')
    return client.get('/api/v1/users', { params })
        .then(response => {
            console.log('Users API response:', response)
            return response
        })
        .catch(error => {
            console.error('Users API error:', error)
            throw error
        })
}

/**
 * Get a specific user by ID
 * @param {string} id - User ID
 * @returns {Promise}
 */
export const getUserById = (id) => {
    return client.get(`/api/v1/users/${id}`)
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise}
 */
export const createUser = (userData) => {
    return client.post('/api/v1/users', userData)
}

/**
 * Update an existing user
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise}
 */
export const updateUser = (id, userData) => {
    return client.put(`/api/v1/users/${id}`, userData)
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
export const deleteUser = (id) => {
    return client.delete(`/api/v1/users/${id}`)
}

/**
 * Get user's roles
 * @param {string} id - User ID
 * @returns {Promise}
 */
export const getUserRoles = (id) => {
    return client.get(`/api/v1/users/${id}/roles`)
}

/**
 * Get user's custom roles
 * @param {string} id - User ID
 * @returns {Promise}
 */
export const getUserCustomRoles = (id) => {
    return client.get(`/api/v1/users/${id}/custom-roles`)
}

/**
 * Get user's organizations
 * @param {string} id - User ID
 * @returns {Promise}
 */
export const getUserOrganizations = (id) => {
    return client.get(`/api/v1/users/${id}/organizations`)
} 