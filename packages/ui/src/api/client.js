import axios from 'axios'
import { baseURL } from '@/store/constant'
import { getSessionToken } from '@descope/react-sdk'

const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    }
})

apiClient.interceptors.request.use(function (config) {
    // Get Descope session token
    const sessionToken = getSessionToken()
    
    if (sessionToken) {
        // Use Bearer token authentication with Descope token
        config.headers.Authorization = `Bearer ${sessionToken}`
    } else {
        // No authentication token available
        console.warn('No authentication token available. Request may fail if authentication is required.')
    }

    return config
})

export default apiClient
