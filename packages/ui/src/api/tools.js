import client from './client'

export const getAllTools = (applicationId) => {
    const params = {}
    if (applicationId && applicationId !== 'global') {
        params.applicationId = applicationId
    }
    return client.get('/tools', { params })
}

export const getSpecificTool = (id, applicationId) => {
    const params = {}
    if (applicationId && applicationId !== 'global') {
        params.applicationId = applicationId
    }
    return client.get(`/tools/${id}`, { params })
}

export const createNewTool = (body) => client.post(`/tools`, body)

export const updateTool = (id, body) => client.put(`/tools/${id}`, body)

export const deleteTool = (id, applicationId) => {
    const params = {}
    if (applicationId && applicationId !== 'global') {
        params.applicationId = applicationId
    }
    return client.delete(`/tools/${id}`, { params })
}

export default {
    getAllTools,
    getSpecificTool,
    createNewTool,
    updateTool,
    deleteTool
}
