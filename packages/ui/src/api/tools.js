import client from './client'

export const getAllTools = () => client.get('/tools')

export const getSpecificTool = (id) => client.get(`/tools/${id}`)

export const createNewTool = (body) => client.post(`/tools`, body)

export const updateTool = (id, body) => client.put(`/tools/${id}`, body)

export const deleteTool = (id) => client.delete(`/tools/${id}`)

export default {
    getAllTools,
    getSpecificTool,
    createNewTool,
    updateTool,
    deleteTool
}
