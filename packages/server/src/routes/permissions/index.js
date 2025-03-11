"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CustomRoleController_1 = require("../../controllers/CustomRoleController");
const router = express_1.default.Router();
// Permissions routes
router.get('/', CustomRoleController_1.CustomRoleController.getAllPermissions);
router.get('/categories', CustomRoleController_1.CustomRoleController.getPermissionCategories);
router.get('/check', CustomRoleController_1.CustomRoleController.checkUserPermission);
exports.default = router;
//# sourceMappingURL=index.js.map