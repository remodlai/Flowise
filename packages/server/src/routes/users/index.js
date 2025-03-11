"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../../controllers/UserController");
const custom_roles_1 = __importDefault(require("./custom-roles"));
const router = express_1.default.Router();
// User CRUD routes
router.get('/', UserController_1.UserController.getAllUsers);
router.post('/', UserController_1.UserController.createUser);
router.get('/:id', UserController_1.UserController.getUserById);
router.put('/:id', UserController_1.UserController.updateUser);
router.delete('/:id', UserController_1.UserController.deleteUser);
// Mount the custom-roles router
router.use('/:id/custom-roles', custom_roles_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map