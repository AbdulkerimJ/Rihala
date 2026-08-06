import SupplierPayment from "./supplierPayment.model.js";
import Purchase from "../purchases/purchase.model.js";
import ValidationError from "../../core/errors/ValidationError.js";

/**
 * Recalculate payment status based on total and allocated amounts.
 */
const getPaymentStatus = (totalAmount, allocatedAmount) => {
  const remaining = (totalAmount || 0) - (allocatedAmount || 0);
  if (allocatedAmount === 0) {
    return "UNPAID";
  } else if (remaining <= 0) {
    return "PAID";
  } else {
    return "PARTIALLY_PAID";
  }
};

/**
 * Helper to explicitely calculate unallocatedAmount on a payment
 */
const explicitUpdatePayment = async (payment, session = null) => {
  const totalAllocated = payment.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  payment.unallocatedAmount = payment.amount - totalAllocated;
  
  if (payment.unallocatedAmount < 0) {
    throw new ValidationError("Allocations cannot exceed the payment amount");
  }

  await payment.save({ session });
};

/**
 * Helper to update purchase allocatedAmount based on a delta
 */
const adjustPurchaseAllocation = async (purchaseId, delta, session = null) => {
  const purchase = await Purchase.findById(purchaseId).session(session);
  if (!purchase) return;
  
  purchase.allocatedAmount = (purchase.allocatedAmount || 0) + delta;
  
  // Explicitly set the paymentStatus!
  purchase.paymentStatus = getPaymentStatus(purchase.totalAmount, purchase.allocatedAmount);
  
  await purchase.save({ session });
};

/**
 * Apply existing supplier credit to a newly created purchase.
 */
export const applyCreditToPurchase = async (purchaseId, session = null) => {
  const purchase = await Purchase.findById(purchaseId).session(session);
  if (!purchase) return;

  let remainingPurchaseAmount = purchase.totalAmount - (purchase.allocatedAmount || 0);
  if (remainingPurchaseAmount <= 0) return;

  // Find payments with unallocated credit, oldest first
  const payments = await SupplierPayment.find({
    supplier: purchase.supplier,
    unallocatedAmount: { $gt: 0 }
  }).session(session).sort({ date: 1 });

  for (const payment of payments) {
    if (remainingPurchaseAmount <= 0) break;

    const allocatable = Math.min(payment.unallocatedAmount, remainingPurchaseAmount);
    
    // Add allocation
    payment.allocations.push({
      purchase: purchase._id,
      amount: allocatable
    });
    
    // Update payment explicitely
    await explicitUpdatePayment(payment, session);
    
    // Update purchase
    await adjustPurchaseAllocation(purchase._id, allocatable, session);
    remainingPurchaseAmount -= allocatable;
  }
};

/**
 * Create a specific payment for a single purchase.
 */
export const allocateSpecificPayment = async (payment, purchaseId, session = null) => {
  const purchase = await Purchase.findById(purchaseId).session(session);
  if (!purchase) {
    throw new ValidationError("Purchase not found");
  }

  const remaining = purchase.totalAmount - (purchase.allocatedAmount || 0);

  if (payment.amount > remaining) {
    throw new ValidationError(`Payment amount (${payment.amount}) exceeds purchase remaining amount (${remaining})`);
  }

  payment.allocations.push({
    purchase: purchase._id,
    amount: payment.amount
  });
  
  await explicitUpdatePayment(payment, session);
  await adjustPurchaseAllocation(purchase._id, payment.amount, session);
};

/**
 * Create a general payment and distribute it among outstanding purchases.
 * Returns the unallocated remaining payment amount.
 */
export const allocateGeneralPayment = async (payment, amountToAllocate = null, session = null) => {
  let remainingPayment = amountToAllocate !== null ? amountToAllocate : payment.amount;

  // Find outstanding purchases (oldest first)
  const outstandingPurchases = await Purchase.find({
    supplier: payment.supplier,
    paymentStatus: { $in: ["UNPAID", "PARTIALLY_PAID"] }
  }).session(session).sort({ date: 1 });

  for (const purchase of outstandingPurchases) {
    if (remainingPayment <= 0) break;

    const purchaseRemaining = purchase.totalAmount - (purchase.allocatedAmount || 0);
    if (purchaseRemaining <= 0) continue;

    const allocatable = Math.min(remainingPayment, purchaseRemaining);
    
    // Check if an allocation already exists to just increment it, otherwise push new
    const existingAllocIndex = payment.allocations.findIndex(a => a.purchase.toString() === purchase._id.toString());
    if (existingAllocIndex > -1) {
      payment.allocations[existingAllocIndex].amount += allocatable;
    } else {
      payment.allocations.push({
        purchase: purchase._id,
        amount: allocatable
      });
    }

    remainingPayment -= allocatable;
    await adjustPurchaseAllocation(purchase._id, allocatable, session);
  }

  await explicitUpdatePayment(payment, session);
};

/**
 * Reconcile a payment when its amount is changed (decreased or increased).
 */
export const reconcilePaymentAmount = async (payment, newAmount, session = null) => {
  let currentTotalAllocated = payment.allocations.reduce((s, a) => s + a.amount, 0);

  if (newAmount > payment.amount) {
    // Payment amount INCREASING
    const difference = newAmount - payment.amount;
    payment.amount = newAmount;

    if (payment.type === "GENERAL") {
      // It's a general payment, so we should automatically allocate the difference to outstanding purchases
      // We first save the new amount so it's technically unallocated, then allocate it
      await explicitUpdatePayment(payment, session);
      // Now allocate the extra amount
      await allocateGeneralPayment(payment, difference, session);
    } else {
      // It's a SPECIFIC payment. The original purchase might have remaining balance.
      // We will try to allocate the difference to the original purchase(s).
      let remainingDiff = difference;
      
      for (const alloc of payment.allocations) {
        if (remainingDiff <= 0) break;
        
        const purchase = await Purchase.findById(alloc.purchase).session(session);
        const purchaseRemaining = purchase.totalAmount - (purchase.allocatedAmount || 0);
        
        if (purchaseRemaining > 0) {
          const allocatable = Math.min(remainingDiff, purchaseRemaining);
          alloc.amount += allocatable;
          remainingDiff -= allocatable;
          await adjustPurchaseAllocation(purchase._id, allocatable, session);
        }
      }
      
      if (remainingDiff > 0) {
        throw new ValidationError(`Payment amount exceeds purchase remaining amount by ${remainingDiff}`);
      }
      
      // Update payment explicitely
      await explicitUpdatePayment(payment, session);
    }
    return;
  }
  
  if (newAmount === payment.amount) {
      return;
  }

  // Payment amount DECREASING
  if (newAmount >= currentTotalAllocated) {
    // Still enough to cover allocations, we just lose some unallocated credit
    payment.amount = newAmount;
    await explicitUpdatePayment(payment, session);
    return;
  }

  // Not enough to cover existing allocations. We must reduce allocations.
  let excess = currentTotalAllocated - newAmount;
  payment.amount = newAmount;

  for (let i = payment.allocations.length - 1; i >= 0; i--) {
    if (excess <= 0) break;

    const alloc = payment.allocations[i];
    const reduceBy = Math.min(alloc.amount, excess);
    
    alloc.amount -= reduceBy;
    excess -= reduceBy;

    // Update the purchase
    await adjustPurchaseAllocation(alloc.purchase, -reduceBy, session);

    if (alloc.amount === 0) {
      payment.allocations.splice(i, 1);
    }
  }

  await explicitUpdatePayment(payment, session);
};

/**
 * Reconcile allocations when a purchase total drops below its allocated amount.
 */
export const reconcilePurchaseTotal = async (purchaseId, session = null) => {
  const purchase = await Purchase.findById(purchaseId).session(session);
  if (!purchase) return;
  
  // Set the payment status explicitly based on the current totals
  purchase.paymentStatus = getPaymentStatus(purchase.totalAmount, purchase.allocatedAmount);
  await purchase.save({ session });

  if (purchase.allocatedAmount <= purchase.totalAmount) {
    return; // All good
  }

  let excessAllocation = purchase.allocatedAmount - purchase.totalAmount;

  // Find payments that have allocated to this purchase
  const payments = await SupplierPayment.find({
    "allocations.purchase": purchase._id
  }).session(session).sort({ date: -1 }); // Newest payments first

  for (const payment of payments) {
    if (excessAllocation <= 0) break;

    const allocIndex = payment.allocations.findIndex(a => a.purchase.toString() === purchase._id.toString());
    if (allocIndex === -1) continue;

    const alloc = payment.allocations[allocIndex];
    const reduceBy = Math.min(alloc.amount, excessAllocation);

    alloc.amount -= reduceBy;
    excessAllocation -= reduceBy;

    if (alloc.amount === 0) {
      payment.allocations.splice(allocIndex, 1);
    }

    await explicitUpdatePayment(payment, session);
    
    // Reduce the purchase's allocatedAmount
    purchase.allocatedAmount -= reduceBy;
  }

  purchase.paymentStatus = getPaymentStatus(purchase.totalAmount, purchase.allocatedAmount);
  await purchase.save({ session });
};

export { getPaymentStatus };
