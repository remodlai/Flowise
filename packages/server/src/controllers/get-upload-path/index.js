"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storageUtils_1 = require("@components/storageUtils");
const getPathForUploads = async (req, res, next) => {
    try {
        const apiResponse = {
            storagePath: (0, storageUtils_1.getStoragePath)()
        };
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getPathForUploads
};
//# sourceMappingURL=index.js.map