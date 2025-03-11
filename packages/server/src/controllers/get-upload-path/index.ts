import { Request, Response, NextFunction } from 'express'
import { getStoragePath } from '@components/storageUtils'

const getPathForUploads = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = {
            storagePath: getStoragePath()
        }
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    getPathForUploads
}
