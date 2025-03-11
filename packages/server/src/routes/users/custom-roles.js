"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CustomRoleController_1 = require("../../controllers/CustomRoleController");
const router = express_1.default.Router();
// User roles routes - The :id parameter is handled by the parent router
router.get('/', CustomRoleController_1.CustomRoleController.getUserRoles);
exports.default = router;
//# sourceMappingURL=custom-roles.js.map