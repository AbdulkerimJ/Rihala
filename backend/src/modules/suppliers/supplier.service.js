import Supplier from "./supplier.model.js";
import supplierQueryConfig from "./supplier.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizePhone } from "../../core/utils/phone.js";

const normalizeSupplierPayload = (data = {}) => {
  const normalizedData = { ...data };

  if (
    normalizedData.name !== undefined &&
    typeof normalizedData.name === "string"
  ) {
    normalizedData.name = normalizedData.name.trim();
  }

  if (normalizedData.phone !== undefined) {
    normalizedData.phone = normalizePhone(normalizedData.phone);
  }

  if (
    normalizedData.address !== undefined &&
    typeof normalizedData.address === "string"
  ) {
    normalizedData.address = normalizedData.address.trim();
  }

  if (
    normalizedData.note !== undefined &&
    typeof normalizedData.note === "string"
  ) {
    normalizedData.note = normalizedData.note.trim();
  }

  return normalizedData;
};

const handleDuplicateSupplierError = (error) => {
  if (error?.code === 11000) {
    const fieldName = Object.keys(error.keyPattern || {})[0] || "field";
    if (fieldName === "phone") {
      const msg = "A supplier with this phone already exists.";
      throw new ConflictError(msg, [{ field: "phone", message: msg }]);
    }
    const msg = `A supplier with this ${fieldName} already exists.`;
    throw new ConflictError(msg, [{ field: fieldName, message: msg }]);
  }
  throw error;
};

const createSupplierService = async (data) => {
  const normalizedData = normalizeSupplierPayload(data);

  if (normalizedData.phone) {
    const existingPhoneSupplier = await Supplier.findOne({
      phone: normalizedData.phone,
    });

    if (existingPhoneSupplier) {
      if (existingPhoneSupplier.deletedAt !== null) {
        // Restore deleted supplier
        existingPhoneSupplier.name = normalizedData.name;
        if (normalizedData.address !== undefined) existingPhoneSupplier.address = normalizedData.address;
        if (normalizedData.note !== undefined) existingPhoneSupplier.note = normalizedData.note;
        existingPhoneSupplier.status = normalizedData.status || "active";
        existingPhoneSupplier.balance = 0; // reset balance
        existingPhoneSupplier.deletedAt = null;
        existingPhoneSupplier.deletedBy = null;
        
        await existingPhoneSupplier.save();
        return existingPhoneSupplier;
      }

      const msg = "A supplier with this phone already exists.";
      throw new ConflictError(msg, [{ field: "phone", message: msg }]);
    }
  }

  try {
    const supplier = await Supplier.create(normalizedData);
    return supplier;
  } catch (error) {
    handleDuplicateSupplierError(error);
  }
};

const getSuppliersService = async (filters = {}) => {
  // Let's add aggregated supplier credit and balance in a future step if needed,
  // but for MVP, we just get the paginated suppliers.
  // Actually, we could use a custom aggregation pipeline if we want credit calculation.
  // For now, getPaginatedQueryResult is fine for the listing.
  // Wait, the requirements state: "The system should be able to calculate... Supplier: total purchases, total payments, outstanding amount, available credit."
  // This can be done via a separate `/suppliers/:id/stats` endpoint or injected into `getSuppliersService` when listing.
  // We'll keep listing lightweight using query.js, and maybe provide an aggregation service later.
  return getPaginatedQueryResult(Supplier, filters, supplierQueryConfig, {
    query: { deletedAt: null }
  });
};

const getSupplierByIdService = async (supplierId) => {
  const supplier = await Supplier.findOne({ _id: supplierId, deletedAt: null });

  if (!supplier) {
    throw new NotFoundError("Supplier not found.");
  }

  return supplier;
};

const updateSupplierService = async (supplierId, updateData) => {
  const supplier = await Supplier.findOne({ _id: supplierId, deletedAt: null });

  if (!supplier) {
    throw new NotFoundError("Supplier not found.");
  }

  const normalizedUpdateData = normalizeSupplierPayload(updateData);

  if (normalizedUpdateData.phone !== undefined) {
    const existingPhoneSupplier = await Supplier.findOne({
      phone: normalizedUpdateData.phone,
      _id: { $ne: supplierId },
    });

    if (existingPhoneSupplier) {
      const msg = "A supplier with this phone already exists.";
      throw new ConflictError(msg, [{ field: "phone", message: msg }]);
    }
  }

  Object.assign(supplier, normalizedUpdateData);

  try {
    await supplier.save();
    return supplier;
  } catch (error) {
    handleDuplicateSupplierError(error);
  }
};

// In case we want to get stats (total purchases, payments, credit)
// We will implement `getSupplierStatsService` later in the Purchases/Payments module 
// and potentially attach it to the supplier response, or keep it as a separate endpoint.

import ValidationError from "../../core/errors/ValidationError.js";

const softDeleteSupplierService = async (supplierId, deletedByUserId) => {
  const supplier = await Supplier.findOne({ _id: supplierId, deletedAt: null });

  if (!supplier) {
    throw new NotFoundError("Supplier not found.");
  }

  if (supplier.balance !== 0) {
    throw new ValidationError(
      "Supplier has an outstanding balance. Settle it before deleting."
    );
  }

  supplier.status = "inactive";
  supplier.deletedAt = new Date();
  supplier.deletedBy = deletedByUserId ?? null;

  await supplier.save();
  return supplier;
};

export {
  createSupplierService,
  getSuppliersService,
  getSupplierByIdService,
  updateSupplierService,
  softDeleteSupplierService,
};
