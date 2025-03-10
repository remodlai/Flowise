import client from './client'

const getAllCredentials = () => client.get('/credentials')

const getCredentialsByName = (componentCredentialName, applicationId) => {
    let url = `/credentials?credentialName=${componentCredentialName}`
    
    if (applicationId && applicationId !== 'global') {
        url += `&applicationId=${applicationId}`
    }
    console.log('Credentials API URL:', url)
    console.log('Component credential name:', componentCredentialName)
    console.log('Application ID:', applicationId)
    
    return client.get(url)
        .then(response => {
            console.log('Credentials API response:', response)
            return response
        })
        .catch(error => {
            console.error('Credentials API error:', error)
            throw error
        })
}

const getAllComponentsCredentials = () => client.get('/components-credentials')

const getSpecificCredential = (id) => client.get(`/credentials/${id}`)

const getSpecificComponentCredential = (name) => client.get(`/components-credentials/${name}`)

const createCredential = (body) => client.post(`/credentials`, body)

const updateCredential = (id, body) => client.put(`/credentials/${id}`, body)

const deleteCredential = (id) => client.delete(`/credentials/${id}`)

export default {
    getAllCredentials,
    getCredentialsByName,
    getAllComponentsCredentials,
    getSpecificCredential,
    getSpecificComponentCredential,
    createCredential,
    updateCredential,
    deleteCredential
}
