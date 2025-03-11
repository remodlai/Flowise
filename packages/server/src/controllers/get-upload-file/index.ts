import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import contentDisposition from 'content-disposition'
import { streamStorageFile } from '@components/storageUtils'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { searchFileMetadata } from '../../services/fileMetadata'
import { downloadFile } from '../../services/storage'
import { StorageError } from '../../errors'

const streamUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.query.chatflowId || !req.query.chatId || !req.query.fileName) {
            return res.status(500).send(`Invalid file path`)
        }
        
        const chatflowId = req.query.chatflowId as string
        const chatId = req.query.chatId as string
        const fileName = req.query.fileName as string
        
        // Set content disposition header
        res.setHeader('Content-Disposition', contentDisposition(fileName))
        
        try {
            // Try to find the file in our database first
            const files = await searchFileMetadata(fileName, {
                filters: {
                    context_type: 'application',
                    context_id: chatflowId,
                    resource_id: chatId
                }
            })
            
            if (files.length > 0) {
                // File found in our database, use our storage service
                try {
                    const { data, file } = await downloadFile(files[0].id)
                    
                    // Set headers
                    res.setHeader('Content-Type', file.content_type)
                    
                    // Send file
                    return res.send(Buffer.from(await data.arrayBuffer()))
                } catch (error) {
                    console.warn('Error downloading file from storage service, falling back to legacy storage:', error)
                    // Fall back to the old storage method if download fails
                }
            }
        } catch (error) {
            console.warn('Error searching for file metadata, falling back to legacy storage:', error)
            // Fall back to the old storage method if search fails
        }
        
        // Fall back to the old storage method
        const fileStream = await streamStorageFile(chatflowId, chatId, fileName)

        if (!fileStream) throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: streamStorageFile`)

        if (fileStream instanceof fs.ReadStream && fileStream?.pipe) {
            fileStream.pipe(res)
        } else {
            res.send(fileStream)
        }
    } catch (error) {
        if (error instanceof StorageError) {
            // Handle storage errors
            if (error.code === 'FILE_NOT_FOUND') {
                return res.status(404).send(`File not found`)
            }
            return res.status(error.statusCode).send(error.message)
        }
        next(error)
    }
}

export default {
    streamUploadedFile
}
