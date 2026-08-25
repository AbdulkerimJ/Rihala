import express from "express";
import * as taskController from "./task.controller.js";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  taskQuerySchema,
} from "./task.validation.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(
    authorize("tasks.read"),
    validate(taskQuerySchema, "Invalid query parameters", "query"),
    taskController.getTasks
  )
  .post(
    authorize("tasks.create"),
    validate(createTaskSchema, "Please correct the highlighted fields", "body"),
    taskController.createTask
  );

router
  .route("/:id")
  .get(
    authorize("tasks.read"),
    validate(taskIdSchema, "Invalid request parameters", "params"),
    taskController.getTaskById
  )
  .patch(
    authorize("tasks.update"),
    validate(taskIdSchema, "Invalid request parameters", "params"),
    validate(updateTaskSchema, "Please correct the highlighted fields", "body"),
    taskController.updateTask
  )
  .delete(
    authorize("tasks.delete"),
    validate(taskIdSchema, "Invalid request parameters", "params"),
    taskController.deleteTask
  );

export default router;
