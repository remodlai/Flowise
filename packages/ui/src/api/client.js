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
    // Try to get Descope session token first
    const sessionToken = getSessionToken()
    
    if (sessionToken) {
        // Use Bearer token authentication with Descope token
        config.headers.Authorization = `Bearer ${sessionToken}`
    } else {
        // Fall back to basic auth if no Descope token (for backward compatibility)
        const username = localStorage.getItem('username')
        const password = localStorage.getItem('password')

        if (username && password) {
            config.auth = {
                username,
                password
            }
        }
    }

    return config
})

export default apiClient
