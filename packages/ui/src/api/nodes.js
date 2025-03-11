import client from './client'

export const getAllNodes = () => client.get('/nodes')

export const getSpecificNode = (id) => client.get(`/nodes/${id}`)

export const getNodesByCategory = (category) => client.get(`/nodes/category/${category}`)

export const executeCustomFunctionNode = (body) => client.post('/nodes/customfunction', body)

// Add default export
export default {
    getAllNodes,
    getSpecificNode,
    getNodesByCategory,
    executeCustomFunctionNode
}
