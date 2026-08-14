import mongoose from "mongoose";
import Purchase from "./purchase.model.js";
import purchaseQueryConfig from "./purchase.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import Material from "../materials/material.model.js";
import Supplier from "../suppliers/supplier.model.js";
import SupplierPayment from "../supplierPayments/supplierPayment.model.js";
import * as allocationService from "../supplierPayments/allocation.service.js";
import Counter from "../../core/models/counter.model.js";

const generatePurchaseNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "purchaseNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `PUR-${counter.seq + 1000}`;
};

const validateAndPrepareItems = async (items, session = null) => {
  let totalAmount = 0;
  const preparedItems = [];

  for (const item of items) {
    const material = await Material.findById(item.material).session(session);
    if (!material) {
      throw new NotFoundError(`Material with ID ${item.material} not found`);
    }
    
    if (material.status !== "active") {
      throw new ValidationError(`Material ${material.name} is inactive`);
    }

    const subtotal = item.quantity * item.unitPrice;
    totalAmount += subtotal;

    preparedItems.push({
      material: material._id,
      materialName: material.name,
      materialCategory: material.category,
      quantity: item.quantity,
      unit: material.unit, // Auto-populate unit from material
      unitPrice: item.unitPrice,
      subtotal,
    });
  }

  return { preparedItems, totalAmount };
};

const createPurchaseService = async (data) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const supplier = await Supplier.findById(data.supplier).session(session);
      if (!supplier) {
        throw new NotFoundError("Supplier not found");
      }

      if (supplier.status === "inactive") {
        throw new ValidationError("Cannot create purchase for an inactive supplier");
      }

      const { preparedItems, totalAmount } = await validateAndPrepareItems(data.items, session);

      const purchaseNumber = data.purchaseNumber || (await generatePurchaseNumber());

      // Ensure purchaseNumber uniqueness
      const existing = await Purchase.findOne({ purchaseNumber }).session(session);
      if (existing) {
        const msg = "Purchase number already exists";
        throw new ConflictError(msg, [{ field: "purchaseNumber", message: msg }]);
      }

      const purchaseData = {
        purchaseNumber,
        supplier: supplier._id,
        date: data.date,
        items: preparedItems,
        totalAmount,
        note: data.note,
        allocatedAmount: 0,
        paymentStatus: "UNPAID",
      };

      const [purchase] = await Purchase.create([purchaseData], { session });

      // Check and apply existing supplier credit to the new purchase
      await allocationService.applyCreditToPurchase(purchase._id, session);

      // Refetch to get the updated allocatedAmount and paymentStatus
      const updatedPurchase = await Purchase.findById(purchase._id).populate(purchaseQueryConfig.populate).session(session);
      return updatedPurchase;
    });
  } finally {
    session.endSession();
  }
};

const getPurchasesService = async (filters = {}) => {
  return getPaginatedQueryResult(Purchase, filters, purchaseQueryConfig);
};

const getPurchaseByIdService = async (purchaseId) => {
  const purchase = await Purchase.findById(purchaseId).populate(purchaseQueryConfig.populate);

  if (!purchase) {
    throw new NotFoundError("Purchase not found.");
  }

  return purchase;
};

const updatePurchaseService = async (purchaseId, updateData) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const purchase = await Purchase.findById(purchaseId).session(session);

      if (!purchase) {
        throw new NotFoundError("Purchase not found.");
      }

      if (updateData.supplier && updateData.supplier.toString() !== purchase.supplier.toString()) {
        const hasFinancialHistory = await SupplierPayment.exists({
          $or: [
            { "allocations.purchase": purchase._id },
            { purchaseId: purchase._id }
          ]
        }).session(session);

        if (hasFinancialHistory) {
            throw new ValidationError("Cannot change supplier after financial history exists for this purchase.");
        }
        const supplier = await Supplier.findById(updateData.supplier).session(session);
        if (!supplier) {
          throw new NotFoundError("Supplier not found");
        }
        purchase.supplier = supplier._id;
      }

      if (updateData.date) purchase.date = updateData.date;
      if (updateData.note !== undefined) purchase.note = updateData.note;

      if (updateData.items) {
        if (purchase.paymentStatus === "PAID") {
          throw new ValidationError("Cannot modify items of a fully paid purchase. Financial history is locked.");
        }
        const { preparedItems, totalAmount } = await validateAndPrepareItems(updateData.items, session);
        purchase.items = preparedItems;
        purchase.totalAmount = totalAmount;
      }
      
      purchase.paymentStatus = allocationService.getPaymentStatus(purchase.totalAmount, purchase.allocatedAmount);

      await purchase.save({ session });

      // If total drops below allocated, or goes above, we need to reconcile allocations.
      await allocationService.reconcilePurchaseTotal(purchase._id, session);

      const updatedPurchase = await Purchase.findById(purchaseId).populate(purchaseQueryConfig.populate).session(session);
      return updatedPurchase;
    });
  } finally {
    session.endSession();
  }
};

export {
  createPurchaseService,
  getPurchasesService,
  getPurchaseByIdService,
  updatePurchaseService,
};
