import axios from 'axios'
import { baseURL } from '@/store/constant'

const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    }
})

// Flag to prevent multiple refresh token requests
let isRefreshing = false
// Queue of requests to retry after token refresh
let refreshSubscribers = []

// Function to process queue of failed requests
const processQueue = (error, token = null) => {
    refreshSubscribers.forEach(callback => {
        if (error) {
            callback(error)
        } else {
            callback(token)
        }
    })
    
    refreshSubscribers = []
}

// Function to refresh the token
const refreshToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
            throw new Error('No refresh token available')
        }
        
        const response = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, {
            refresh_token: refreshToken
        })
        
        // Extract session data from the response
        const { session } = response.data
        
        if (!session || !session.access_token) {
            throw new Error('Invalid response from refresh token endpoint')
        }
        
        // Update tokens in local storage
        localStorage.setItem('access_token', session.access_token)
        localStorage.setItem('refresh_token', session.refresh_token)
        localStorage.setItem('token_expiry', session.expires_at.toString())
        
        return session.access_token
    } catch (error) {
        console.error('Error refreshing token:', error)
        // Clear auth data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token_expiry')
        localStorage.removeItem('user')
        
        // Redirect to login page
        window.location.href = '/login'
        throw error
    }
}

apiClient.interceptors.request.use(function (config) {
    // Get access token from localStorage
    const accessToken = localStorage.getItem('access_token')
    
    if (accessToken) {
        // Use Bearer token authentication with Supabase token
        config.headers.Authorization = `Bearer ${accessToken}`
        console.log(`Adding Authorization header for request to ${config.url}`)
    } else {
        // No authentication token available
        console.warn(`No authentication token available for request to ${config.url}. Request may fail if authentication is required.`)
    }

    // Add application context if available
    const applicationId = localStorage.getItem('selectedApplicationId')
    if (applicationId && applicationId !== 'global') {
        config.headers['X-Application-ID'] = applicationId
        console.log(`Adding X-Application-ID header: ${applicationId}`)
    } else if (applicationId === 'global') {
        console.log('Using global application context (no X-Application-ID header)')
    }

    return config
})

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
    response => {
        console.log(`Response from ${response.config.url}:`, {
            status: response.status,
            data: response.data
        })
        return response
    },
    async error => {
        console.error(`Error response from ${error.config?.url}:`, {
            status: error.response?.status,
            data: error.response?.data
        })
        
        const originalRequest = error.config
        
        // If unauthorized error (401) and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Add request to queue to retry later
                return new Promise((resolve, reject) => {
                    refreshSubscribers.push(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        resolve(axios(originalRequest))
                    })
                })
            }
            
            originalRequest._retry = true
            isRefreshing = true
            
            try {
                const newToken = await refreshToken()
                processQueue(null, newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return axios(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
        
        return Promise.reject(error)
    }
)

export default apiClient
