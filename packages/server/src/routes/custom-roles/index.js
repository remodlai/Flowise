"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CustomRoleController_1 = require("../../controllers/CustomRoleController");
const router = express_1.default.Router();
// Custom Roles routes
router.get('/', CustomRoleController_1.CustomRoleController.getAllRoles);
router.post('/', CustomRoleController_1.CustomRoleController.createRole);
router.get('/:id', CustomRoleController_1.CustomRoleController.getRoleById);
router.put('/:id', CustomRoleController_1.CustomRoleController.updateRole);
router.delete('/:id', CustomRoleController_1.CustomRoleController.deleteRole);
// Role permissions routes
router.get('/:id/permissions', CustomRoleController_1.CustomRoleController.getRolePermissions);
router.post('/:id/permissions', CustomRoleController_1.CustomRoleController.addRolePermissions);
router.delete('/:id/permissions/:permission', CustomRoleController_1.CustomRoleController.removeRolePermission);
// Direct SQL route for permissions
router.get('/:id/permissions-direct', CustomRoleController_1.CustomRoleController.getRolePermissionsDirectSQL);
// Role users routes
router.get('/:id/users', CustomRoleController_1.CustomRoleController.getRoleUsers);
router.post('/:id/users', CustomRoleController_1.CustomRoleController.assignRoleToUser);
router.delete('/:id/users/:user_id', CustomRoleController_1.CustomRoleController.removeRoleFromUser);
exports.default = router;
//# sourceMappingURL=index.js.map