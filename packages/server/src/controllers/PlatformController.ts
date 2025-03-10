import { Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import nodesService from '../services/nodes'

// Define interfaces for our data types
interface NodeModule {
    name: string;
    description?: string;
    category?: string;
    [key: string]: any;
}

interface Tool {
    name: string;
    description: string;
    category: string;
    [key: string]: any;
}

/**
 * Platform management controller
 */
export class PlatformController {
    /**
     * Get all nodes with their enabled status
     * @param req
     * @param res
     */
    async getNodesWithEnabledStatus(req: Request, res: Response) {
        try {
            const supabase = this.getSupabaseClient(req)
            if (!supabase) return res.status(401).send('Unauthorized')

            // Get all available nodes from the system
            const availableNodes = await nodesService.getAllNodes()
            
            // Get all enabled nodes from the database
            const { data: enabledNodes, error } = await supabase.rpc('get_enabled_nodes')
            
            if (error) {
                console.error('Error fetching enabled nodes:', error)
                return res.status(500).send(`Error fetching enabled nodes: ${error.message}`)
            }

            // Convert enabled nodes to a Set for faster lookup
            const enabledNodesSet = new Set(enabledNodes?.map((node: { node_type: string }) => node.node_type) || [])
            
            // Map available nodes to include enabled status
            const nodesWithStatus = availableNodes.map((node: NodeModule) => ({
                ...node,
                enabled: enabledNodesSet.has(node.name) || !enabledNodesSet.size // If no records exist, all nodes are enabled by default
            }))

            return res.json(nodesWithStatus)
        } catch (error: any) {
            console.error('Error in getNodesWithEnabledStatus:', error)
            return res.status(500).send(`Error getting nodes with enabled status: ${error.message}`)
        }
    }

    /**
     * Toggle node enabled status
     * @param req
     * @param res
     */
    async toggleNodeEnabled(req: Request, res: Response) {
        try {
            const { nodeType, enabled } = req.body
            if (!nodeType) return res.status(400).send('Node type is required')
            
            const supabase = this.getSupabaseClient(req)
            if (!supabase) return res.status(401).send('Unauthorized')

            const { data, error } = await supabase.rpc('toggle_node_enabled', {
                input_node_type: nodeType,
                input_enabled: enabled
            })

            if (error) {
                console.error('Error toggling node enabled status:', error)
                return res.status(500).send(`Error toggling node enabled status: ${error.message}`)
            }

            return res.json({ success: data })
        } catch (error: any) {
            console.error('Error in toggleNodeEnabled:', error)
            return res.status(500).send(`Error toggling node enabled status: ${error.message}`)
        }
    }

    /**
     * Get all tools with their enabled status
     * @param req
     * @param res
     */
    async getToolsWithEnabledStatus(req: Request, res: Response) {
        try {
            const supabase = this.getSupabaseClient(req)
            if (!supabase) return res.status(401).send('Unauthorized')

            // For now, we'll return a placeholder for tools
            // In a real implementation, you would fetch the actual tools
            const availableTools: Tool[] = [
                { name: 'Tool1', description: 'Description for Tool1', category: 'Category1' },
                { name: 'Tool2', description: 'Description for Tool2', category: 'Category1' },
                { name: 'Tool3', description: 'Description for Tool3', category: 'Category2' }
            ]
            
            // Get all enabled tools from the database
            const { data: enabledTools, error } = await supabase.rpc('get_enabled_tools')
            
            if (error) {
                console.error('Error fetching enabled tools:', error)
                return res.status(500).send(`Error fetching enabled tools: ${error.message}`)
            }

            // Convert enabled tools to a Set for faster lookup
            const enabledToolsSet = new Set(enabledTools?.map((tool: { tool_type: string }) => tool.tool_type) || [])
            
            // Map available tools to include enabled status
            const toolsWithStatus = availableTools.map((tool: Tool) => ({
                ...tool,
                enabled: enabledToolsSet.has(tool.name) || !enabledToolsSet.size // If no records exist, all tools are enabled by default
            }))

            return res.json(toolsWithStatus)
        } catch (error: any) {
            console.error('Error in getToolsWithEnabledStatus:', error)
            return res.status(500).send(`Error getting tools with enabled status: ${error.message}`)
        }
    }

    /**
     * Toggle tool enabled status
     * @param req
     * @param res
     */
    async toggleToolEnabled(req: Request, res: Response) {
        try {
            const { toolType, enabled } = req.body
            if (!toolType) return res.status(400).send('Tool type is required')
            
            const supabase = this.getSupabaseClient(req)
            if (!supabase) return res.status(401).send('Unauthorized')

            const { data, error } = await supabase.rpc('toggle_tool_enabled', {
                input_tool_type: toolType,
                input_enabled: enabled
            })

            if (error) {
                console.error('Error toggling tool enabled status:', error)
                return res.status(500).send(`Error toggling tool enabled status: ${error.message}`)
            }

            return res.json({ success: data })
        } catch (error: any) {
            console.error('Error in toggleToolEnabled:', error)
            return res.status(500).send(`Error toggling tool enabled status: ${error.message}`)
        }
    }

    /**
     * Helper method to get Supabase client from request
     * @param req
     * @returns 
     */
    private getSupabaseClient(req: Request) {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) return null

        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase URL or key not configured')
            return null
        }
        //REMODL TODO: IS this part of our token refresh problem?
        return createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        })
    }
} 