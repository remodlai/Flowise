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
        
        const { access_token, refresh_token, expires_at } = response.data
        
        // Update tokens in local storage
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        localStorage.setItem('token_expiry', expires_at.toString())
        
        return access_token
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
    } else {
        // No authentication token available
        console.warn('No authentication token available. Request may fail if authentication is required.')
    }

    return config
})

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
    response => {
        return response
    },
    async error => {
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
