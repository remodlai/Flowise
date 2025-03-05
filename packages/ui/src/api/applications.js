import client from './client'

/**
 * Get all applications
 * @returns {Promise} Promise object that resolves to an array of applications
 */
export const getAllApplications = () => client.get('/applications')

/**
 * Get applications for the current user
 * @returns {Promise} Promise object that resolves to an array of applications the user has access to
 */
export const getUserApplications = () => client.get('/user/applications')

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
 * 
 * @example
 * // Example with flattened structure
 * updateApplicationSettings('app-id', {
 *   api_calls_daily_limit: 20000,
 *   api_calls_monthly_limit: 500000,
 *   storage_max_gb: 100,
 *   users_max_count: 50,
 *   file_uploads_enabled: true,
 *   custom_domains_enabled: true,
 *   sso_enabled: false,
 *   api_access_enabled: true,
 *   advanced_analytics_enabled: true,
 *   enabled_models: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus']
 * })
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
 * 
 * @example
 * // Example with flattened structure
 * createApplicationBillingPlan('app-id', {
 *   name: 'Enterprise',
 *   description: 'For large organizations',
 *   price: 499.99,
 *   interval: 'monthly',
 *   feature_api_access: true,
 *   feature_custom_domain: true,
 *   feature_priority_support: true,
 *   feature_advanced_analytics: true,
 *   feature_unlimited_users: true,
 *   is_default: false
 * })
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
 * Get API keys for an application
 * @param {string} id - The application ID
 * @param {Object} params - Query parameters (e.g., { organization_id: 'org-id' })
 * @returns {Promise} Promise object that resolves to an array of API keys
 */
export const getApplicationApiKeys = (id, params = {}) => client.get(`/applications/${id}/api-keys`, { params })

/**
 * Create an API key for an application
 * @param {string} id - The application ID
 * @param {Object} keyData - The API key data
 * @returns {Promise} Promise object that resolves to the created API key
 * 
 * @example
 * // Example with flattened structure
 * createApplicationApiKey('app-id', {
 *   key_name: 'Production API Key',
 *   organization_id: 'org-id', // Optional
 *   read_permission: true,
 *   write_permission: true,
 *   expires_at: '2023-12-31T23:59:59Z' // Optional
 * })
 */
export const createApplicationApiKey = (id, keyData) => client.post(`/applications/${id}/api-keys`, keyData)

/**
 * Update an API key
 * @param {string} id - The application ID
 * @param {string} keyId - The API key ID
 * @param {Object} keyData - The updated API key data
 * @returns {Promise} Promise object that resolves to the updated API key
 */
export const updateApplicationApiKey = (id, keyId, keyData) => client.put(`/applications/${id}/api-keys/${keyId}`, keyData)

/**
 * Delete an API key
 * @param {string} id - The application ID
 * @param {string} keyId - The API key ID
 * @returns {Promise} Promise object that resolves when the API key is deleted
 */
export const deleteApplicationApiKey = (id, keyId) => client.delete(`/applications/${id}/api-keys/${keyId}`)

/**
 * Get chat sessions for an application
 * @param {string} id - The application ID
 * @param {Object} params - Query parameters (e.g., { organization_id: 'org-id', user_id: 'user-id' })
 * @returns {Promise} Promise object that resolves to an array of chat sessions
 */
export const getApplicationChatSessions = (id, params = {}) => client.get(`/applications/${id}/chat-sessions`, { params })

/**
 * Get a specific chat session
 * @param {string} id - The application ID
 * @param {string} chatId - The chat session ID
 * @returns {Promise} Promise object that resolves to the chat session
 */
export const getApplicationChatSession = (id, chatId) => client.get(`/applications/${id}/chat-sessions/${chatId}`)

/**
 * Create a chat session for an application
 * @param {string} id - The application ID
 * @param {Object} sessionData - The chat session data
 * @returns {Promise} Promise object that resolves to the created chat session
 * 
 * @example
 * // Example with flattened structure
 * createApplicationChatSession('app-id', {
 *   organization_id: 'org-id', // Optional
 *   user_id: 'user-id', // Optional
 *   flow_id: 'flow-id', // Optional
 *   title: 'Customer Support Chat',
 *   source: 'web',
 *   is_pinned: false,
 *   message_count: 0,
 *   last_message_content: null
 * })
 */
export const createApplicationChatSession = (id, sessionData) => client.post(`/applications/${id}/chat-sessions`, sessionData)

/**
 * Update a chat session
 * @param {string} id - The application ID
 * @param {string} chatId - The chat session ID
 * @param {Object} sessionData - The updated chat session data
 * @returns {Promise} Promise object that resolves to the updated chat session
 * 
 * @example
 * // Example with flattened structure for updating after a new message
 * updateApplicationChatSession('app-id', 'chat-id', {
 *   message_count: 5,
 *   last_message_content: 'The last message in the conversation',
 *   last_message_at: new Date().toISOString()
 * })
 */
export const updateApplicationChatSession = (id, chatId, sessionData) => client.put(`/applications/${id}/chat-sessions/${chatId}`, sessionData)

/**
 * Delete a chat session
 * @param {string} id - The application ID
 * @param {string} chatId - The chat session ID
 * @returns {Promise} Promise object that resolves when the chat session is deleted
 */
export const deleteApplicationChatSession = (id, chatId) => client.delete(`/applications/${id}/chat-sessions/${chatId}`)

/**
 * Get flow runs for an application
 * @param {string} id - The application ID
 * @param {Object} params - Query parameters (e.g., { flow_id: 'flow-id', status: 'success' })
 * @returns {Promise} Promise object that resolves to an array of flow runs
 */
export const getApplicationFlowRuns = (id, params = {}) => client.get(`/applications/${id}/flow-runs`, { params })

/**
 * Get a specific flow run
 * @param {string} id - The application ID
 * @param {string} runId - The flow run ID
 * @returns {Promise} Promise object that resolves to the flow run
 */
export const getApplicationFlowRun = (id, runId) => client.get(`/applications/${id}/flow-runs/${runId}`)

/**
 * Create a flow run
 * @param {string} id - The application ID
 * @param {Object} runData - The flow run data
 * @returns {Promise} Promise object that resolves to the created flow run
 * 
 * @example
 * // Example with flattened structure
 * createApplicationFlowRun('app-id', {
 *   organization_id: 'org-id', // Optional
 *   user_id: 'user-id', // Optional
 *   flow_id: 'flow-id',
 *   chat_id: 'chat-id', // Optional
 *   status: 'running',
 *   input_text: 'What is the weather like today?',
 *   source: 'api',
 *   model_name: 'gpt-4'
 * })
 */
export const createApplicationFlowRun = (id, runData) => client.post(`/applications/${id}/flow-runs`, runData)

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
 * @param {Object} params - Query parameters (e.g., { organization_id: 'org-id', is_image: true })
 * @returns {Promise} Promise object that resolves to an array of files
 */
export const getApplicationFiles = (id, params = {}) => client.get(`/applications/${id}/files`, { params })

/**
 * Get a specific file
 * @param {string} id - The application ID
 * @param {string} fileId - The file ID
 * @returns {Promise} Promise object that resolves to the file
 */
export const getApplicationFile = (id, fileId) => client.get(`/applications/${id}/files/${fileId}`)

/**
 * Upload a file to an application
 * @param {string} id - The application ID
 * @param {FormData} formData - The form data containing the file
 * @param {Object} params - Query parameters (e.g., { organization_id: 'org-id', is_public: true })
 * @returns {Promise} Promise object that resolves to the uploaded file
 * 
 * @example
 * // Example usage
 * const formData = new FormData();
 * formData.append('file', fileObject);
 * formData.append('organization_id', 'org-id'); // Optional
 * formData.append('is_public', true); // Optional
 * uploadApplicationFile('app-id', formData)
 */
export const uploadApplicationFile = (id, formData, params = {}) => {
  return client.post(`/applications/${id}/files`, formData, {
    params,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Delete a file from an application
 * @param {string} id - The application ID
 * @param {string} fileId - The file ID
 * @returns {Promise} Promise object that resolves when the file is deleted
 */
export const deleteApplicationFile = (id, fileId) => client.delete(`/applications/${id}/files/${fileId}`)

/**
 * Get the storage usage for an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to the storage usage
 */
export const getApplicationStorageUsage = (id) => client.get(`/applications/${id}/storage-usage`)

/**
 * Get document stores for an application
 * @param {string} id - The application ID
 * @returns {Promise} Promise object that resolves to an array of document stores
 */
export const getApplicationDocumentStores = (id) => client.get(`/applications/${id}/document-stores`)