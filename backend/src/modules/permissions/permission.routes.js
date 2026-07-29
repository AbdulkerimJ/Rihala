import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import { getAllPermissionsController } from "./permission.controller.js";

const router = express.Router();

// Protect all permission routes with authentication
router.use(authenticate);

// Get all permissions.
router.get("/", authorize("permissions.read"), getAllPermissionsController);

export default router;
