import { baseURL } from '@/store/constant'

/**
 * Helper function to generate authenticated image URLs
 * @param {string} path - The path to append to the baseURL
 * @returns {string} The full authenticated image URL
 */
export const getAuthenticatedImageUrl = (path) => {
  return `${baseURL}${path}`
}

/**
 * Loads an image with authentication headers
 * Used for node icons and other authenticated image resources
 * @param {string} src - Image source URL
 * @param {function} onLoad - Callback when image loads successfully
 * @param {function} onError - Callback when image fails to load
 */
export const loadAuthenticatedImage = (src, onLoad, onError) => {
  // Create a new image element
  const img = new Image()
  
  // Set up load and error handlers
  if (onLoad) img.onload = onLoad
  if (onError) img.onerror = onError
  
  // Get the token from localStorage
  const token = localStorage.getItem('access_token')
  
  // Use fetch to get the image with authorization header
  fetch(src, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`)
      }
      return response.blob()
    })
    .then(blob => {
      // Create object URL from blob and set as image source
      const objectUrl = URL.createObjectURL(blob)
      img.src = objectUrl
    })
    .catch(err => {
      console.error('Error loading authenticated image:', err)
      if (onError) onError(err)
    })
  
  return img
} 