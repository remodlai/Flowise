import axios from 'axios'
import { baseURL } from '@/store/constant'

const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    }
})

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

export default apiClient
