"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PlatformController_1 = require("../controllers/PlatformController");
const authorizationMiddleware_1 = require("../middlewares/authorizationMiddleware");
const platformController = new PlatformController_1.PlatformController();
const router = express_1.default.Router();
// Get all nodes with their enabled status
router.get('/nodes', (0, authorizationMiddleware_1.checkAuthorization)(['platform.admin']), platformController.getNodesWithEnabledStatus.bind(platformController));
// Toggle node enabled status
router.post('/nodes/toggle', (0, authorizationMiddleware_1.checkAuthorization)(['platform.admin']), platformController.toggleNodeEnabled.bind(platformController));
// Get all tools with their enabled status
router.get('/tools', (0, authorizationMiddleware_1.checkAuthorization)(['platform.admin']), platformController.getToolsWithEnabledStatus.bind(platformController));
// Toggle tool enabled status
router.post('/tools/toggle', (0, authorizationMiddleware_1.checkAuthorization)(['platform.admin']), platformController.toggleToolEnabled.bind(platformController));
exports.default = router;
//# sourceMappingURL=platform.js.map