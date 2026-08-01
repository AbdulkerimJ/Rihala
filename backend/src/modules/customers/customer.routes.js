import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllCustomersController,
  createCustomerController,
  getCustomerByIdController,
  updateCustomerController,
} from "./customer.controller.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  customerQuerySchema,
} from "./customer.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("customers.read"),
  validate(customerQuerySchema, "Please check the customer filters.", "query"),
  getAllCustomersController,
);

router.post(
  "/",
  authorize("customers.create"),
  validate(createCustomerSchema, "Please check the customer information."),
  createCustomerController,
);

router.get(
  "/:id",
  authorize("customers.read"),
  validate(customerIdSchema, "Please check the customer id.", "params"),
  getCustomerByIdController,
);

router.patch(
  "/:id",
  authorize("customers.update"),
  validate(customerIdSchema, "Please check the customer id.", "params"),
  validate(updateCustomerSchema, "Please check the customer information."),
  updateCustomerController,
);

export default router;
