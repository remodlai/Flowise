import { INodeParams, INodeCredential } from '../src/Interface'

class MemgraphApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Memgraph API'
        this.name = 'memgraphApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://neo4j.com/docs/operations-manual/current/authentication-authorization/">official guide</a> on Neo4j authentication'
        this.inputs = [
            {
                label: 'Memgraph URL',
                name: 'url',
                type: 'string',
                description: 'Your Memgraph instance URL (e.g., bolt://localhost:7687)'
            },
            {
                label: 'Username',
                name: 'username',
                type: 'string',
                description: 'Memgraph database username'
            },
            {
                label: 'Password',
                name: 'password',
                type: 'password',
                description: 'Memgraph database password'
            }
        ]
    }
}

module.exports = { credClass: MemgraphApi }
