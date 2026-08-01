import express from "express";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
} from "./order.controller.js";
import {
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema,
  orderQuerySchema,
} from "./order.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("orders.read"),
  validate(orderQuerySchema, "Please check the order filters.", "query"),
  getOrders,
);

router.post(
  "/",
  authorize("orders.create"),
  validate(createOrderSchema, "Please check the order information."),
  createOrder,
);

router.get(
  "/:id",
  authorize("orders.read"),
  validate(orderIdSchema, "Please check the order id.", "params"),
  getOrderById,
);

router.patch(
  "/:id",
  authorize("orders.update"),
  validate(orderIdSchema, "Please check the order id.", "params"),
  validate(updateOrderSchema, "Please check the order information."),
  updateOrder,
);

export default router;
