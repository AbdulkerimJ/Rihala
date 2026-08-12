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
    validate(taskQuerySchema, "query"),
    taskController.getTasks
  )
  .post(
    authorize("tasks.create"),
    validate(createTaskSchema, "body"),
    taskController.createTask
  );

router
  .route("/:id")
  .get(
    authorize("tasks.read"),
    validate(taskIdSchema, "params"),
    taskController.getTaskById
  )
  .patch(
    authorize("tasks.update"),
    validate(taskIdSchema, "params"),
    validate(updateTaskSchema, "body"),
    taskController.updateTask
  )
  .delete(
    authorize("tasks.delete"),
    validate(taskIdSchema, "params"),
    taskController.deleteTask
  );

export default router;
