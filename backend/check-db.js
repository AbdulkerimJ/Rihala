import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchase from "./src/modules/purchases/purchase.model.js";
import SupplierPayment from "./src/modules/supplierPayments/supplierPayment.model.js";
import Supplier from "./src/modules/suppliers/supplier.model.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(2).populate('supplier');
  console.log("Last 2 Purchases:");
  purchases.forEach(p => {
    console.log(`- ID: ${p._id}, Total: ${p.totalAmount}, Allocated: ${p.allocatedAmount}, Status: ${p.paymentStatus}, Supplier: ${p.supplier.name}`);
  });

  if (purchases.length > 0) {
    const supplierId = purchases[0].supplier._id;
    const payments = await SupplierPayment.find({ supplier: supplierId }).sort({ createdAt: -1 });
    console.log("\nPayments for Supplier:");
    payments.forEach(p => {
      console.log(`- ID: ${p._id}, Type: ${p.type}, Amount: ${p.amount}, Unallocated: ${p.unallocatedAmount}, Allocations: ${JSON.stringify(p.allocations)}`);
    });
  }

  mongoose.disconnect();
};

run();
