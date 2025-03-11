"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const export_import_1 = __importDefault(require("../../services/export-import"));
const exportData = async (req, res, next) => {
    try {
        const apiResponse = await export_import_1.default.exportData(export_import_1.default.convertExportInput(req.body));
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const importData = async (req, res, next) => {
    try {
        const importData = req.body;
        await export_import_1.default.importData(importData);
        return res.json({ message: 'success' });
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    exportData,
    importData
};
//# sourceMappingURL=index.js.map