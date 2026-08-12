import express from "express";
import * as taskTypeController from "./taskType.controller.js";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  createTaskTypeSchema,
  updateTaskTypeSchema,
  taskTypeIdSchema,
  taskTypeQuerySchema,
} from "./taskType.validation.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(
    authorize("taskTypes.read"),
    validate(taskTypeQuerySchema, "query"),
    taskTypeController.getTaskTypes
  )
  .post(
    authorize("taskTypes.create"),
    validate(createTaskTypeSchema, "body"),
    taskTypeController.createTaskType
  );

router
  .route("/:id")
  .get(
    authorize("taskTypes.read"),
    validate(taskTypeIdSchema, "params"),
    taskTypeController.getTaskTypeById
  )
  .patch(
    authorize("taskTypes.update"),
    validate(taskTypeIdSchema, "params"),
    validate(updateTaskTypeSchema, "body"),
    taskTypeController.updateTaskType
  )
  .delete(
    authorize("taskTypes.delete"),
    validate(taskTypeIdSchema, "params"),
    taskTypeController.deleteTaskType
  );

export default router;
