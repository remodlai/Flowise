import client from './client'

/**
 * Get all applications
 * @returns {Promise} Promise object that resolves to an array of applications
 */
export const getAllApplications = () => client.get('/applications')

/**
 * Get a specific application by ID
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to the application data
 */
export const getApplication = (id) => client.get(`/applications/${id}`)

/**
 * Create a new application
 * @param {Object} applicationData - The application data
 * @returns {Promise} Promise object that resolves to the created application
 */
export const createApplication = (applicationData) => client.post('/applications', applicationData)

/**
 * Update an existing application
 * @param {string} id - The application ID
 * @param {Object} applicationData - The updated application data
 * @returns {Promise} Promise object that resolves to the updated application
 */
export const updateApplication = (id, applicationData) => client.put(`/applications/${id}`, applicationData)

/**
 * Delete an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves when the application is deleted
 */
export const deleteApplication = (id) => client.delete(`/applications/${id}`)

/**
 * Get application statistics
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to the application statistics
 */
export const getApplicationStats = (id) => client.get(`/applications/${id}/stats`)

/**
 * Get application settings
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to the application settings
 */
export const getApplicationSettings = (id) => client.get(`/applications/${id}/settings`)

/**
 * Update application settings
 * @param {string} id - The application ID
 * @param {Object} settingsData - The updated settings data
 * @returns {Promise} Promise object that resolves to the updated settings
 */
export const updateApplicationSettings = (id, settingsData) => client.put(`/applications/${id}/settings`, settingsData)

/**
 * Get application branding
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to the application branding
 */
export const getApplicationBranding = (id) => client.get(`/applications/${id}/branding`)

/**
 * Update application branding
 * @param {string} id - The application ID
 * @param {Object} brandingData - The updated branding data
 * @returns {Promise} Promise object that resolves to the updated branding
 */
export const updateApplicationBranding = (id, brandingData) => client.put(`/applications/${id}/branding`, brandingData)

/**
 * Get application billing plans
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of billing plans
 */
export const getApplicationBillingPlans = (id) => client.get(`/applications/${id}/billing-plans`)

/**
 * Create a billing plan for an application
 * @param {string} id - The application ID
 * @param {Object} planData - The billing plan data
 * @returns {Promise} Promise object that resolves to the created billing plan
 */
export const createApplicationBillingPlan = (id, planData) => client.post(`/applications/${id}/billing-plans`, planData)

/**
 * Update a billing plan
 * @param {string} id - The application ID
 * @param {string} planId - The billing plan ID
 * @param {Object} planData - The updated billing plan data
 * @returns {Promise} Promise object that resolves to the updated billing plan
 */
export const updateApplicationBillingPlan = (id, planId, planData) => client.put(`/applications/${id}/billing-plans/${planId}`, planData)

/**
 * Delete a billing plan
 * @param {string} id - The application ID
 * @param {string} planId - The billing plan ID
 * @returns {Promise} Promise object that resolves when the billing plan is deleted
 */
export const deleteApplicationBillingPlan = (id, planId) => client.delete(`/applications/${id}/billing-plans/${planId}`)

/**
 * Get application folders
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of folders
 */
export const getApplicationFolders = (id) => client.get(`/applications/${id}/folders`)

/**
 * Create a folder for an application
 * @param {string} id - The application ID
 * @param {Object} folderData - The folder data
 * @returns {Promise} Promise object that resolves to the created folder
 */
export const createApplicationFolder = (id, folderData) => client.post(`/applications/${id}/folders`, folderData)

/**
 * Update a folder
 * @param {string} id - The application ID
 * @param {string} folderId - The folder ID
 * @param {Object} folderData - The updated folder data
 * @returns {Promise} Promise object that resolves to the updated folder
 */
export const updateApplicationFolder = (id, folderId, folderData) => client.put(`/applications/${id}/folders/${folderId}`, folderData)

/**
 * Delete a folder
 * @param {string} id - The application ID
 * @param {string} folderId - The folder ID
 * @returns {Promise} Promise object that resolves when the folder is deleted
 */
export const deleteApplicationFolder = (id, folderId) => client.delete(`/applications/${id}/folders/${folderId}`)

/**
 * Get application tools
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of tools
 */
export const getApplicationTools = (id) => client.get(`/applications/${id}/tools`)

/**
 * Add a tool to an application
 * @param {string} id - The application ID
 * @param {string} toolId - The tool ID
 * @param {boolean} enabled - Whether the tool is enabled
 * @returns {Promise} Promise object that resolves to the added tool
 */
export const addApplicationTool = (id, toolId, enabled = true) => client.post(`/applications/${id}/tools`, { toolId, enabled })

/**
 * Update a tool's status for an application
 * @param {string} id - The application ID
 * @param {string} toolId - The tool ID
 * @param {boolean} enabled - Whether the tool is enabled
 * @returns {Promise} Promise object that resolves to the updated tool
 */
export const updateApplicationTool = (id, toolId, enabled) => client.put(`/applications/${id}/tools/${toolId}`, { enabled })

/**
 * Remove a tool from an application
 * @param {string} id - The application ID
 * @param {string} toolId - The tool ID
 * @returns {Promise} Promise object that resolves when the tool is removed
 */
export const removeApplicationTool = (id, toolId) => client.delete(`/applications/${id}/tools/${toolId}`)

/**
 * Get organizations for an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of organizations
 */
export const getApplicationOrganizations = (id) => client.get(`/applications/${id}/organizations`)

/**
 * Get users for an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of users
 */
export const getApplicationUsers = (id) => client.get(`/applications/${id}/users`)

/**
 * Get flows for an application
 * @param {string} id - The application ID
 * @param {Object} params - Query parameters (e.g., { folder_path: '/skills' })
 * @returns {Promise} Promise object that resolves to an array of flows
 */
export const getApplicationFlows = (id, params = {}) => client.get(`/applications/${id}/flows`, { params })

/**
 * Get credentials for an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of credentials
 */
export const getApplicationCredentials = (id) => client.get(`/applications/${id}/credentials`)

/**
 * Get files for an application
 * @param {string} id - The application ID
 * @param {Object} params - Query parameters (e.g., { type: 'image' })
 * @returns {Promise} Promise object that resolves to an array of files
 */
export const getApplicationFiles = (id, params = {}) => client.get(`/applications/${id}/files`, { params })

/**
 * Get document stores for an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of document stores
 */
export const getApplicationDocumentStores = (id) => client.get(`/applications/${id}/document-stores`) 