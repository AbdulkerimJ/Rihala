import Customer from "./customer.model.js";
import customerQueryConfig from "./customer.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizePhone } from "../../core/utils/phone.js";

const normalizeCustomerPayload = (data = {}) => {
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

  if (normalizedData.email !== undefined) {
    if (typeof normalizedData.email === "string") {
      const trimmedEmail = normalizedData.email.trim();
      normalizedData.email = trimmedEmail
        ? trimmedEmail.toLowerCase()
        : undefined;
    }
  }

  if (
    normalizedData.address !== undefined &&
    typeof normalizedData.address === "string"
  ) {
    normalizedData.address = normalizedData.address.trim();
  }

  if (
    normalizedData.notes !== undefined &&
    typeof normalizedData.notes === "string"
  ) {
    normalizedData.notes = normalizedData.notes.trim();
  }

  return normalizedData;
};

const handleDuplicateCustomerError = (error) => {
  if (error?.code === 11000) {
    const fieldName = Object.keys(error.keyPattern || {})[0] || "field";

    if (fieldName === "phone") {
      throw new ConflictError("A customer with this phone already exists.");
    }

    if (fieldName === "email") {
      throw new ConflictError("A customer with this email already exists.");
    }

    throw new ConflictError("A customer with this value already exists.");
  }

  throw error;
};

const createCustomerService = async (data) => {
  const normalizedData = normalizeCustomerPayload(data);

  if (normalizedData.phone) {
    const existingPhoneCustomer = await Customer.findOne({
      phone: normalizedData.phone,
    });

    if (existingPhoneCustomer) {
      throw new ConflictError("A customer with this phone already exists.");
    }
  }

  if (normalizedData.email) {
    const existingEmailCustomer = await Customer.findOne({
      email: normalizedData.email,
    });

    if (existingEmailCustomer) {
      throw new ConflictError("A customer with this email already exists.");
    }
  }

  try {
    const customer = await Customer.create(normalizedData);
    return customer;
  } catch (error) {
    handleDuplicateCustomerError(error);
  }
};

const getCustomersService = async (filters = {}) => {
  return getPaginatedQueryResult(Customer, filters, customerQueryConfig);
};

const getCustomerByIdService = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  return customer;
};

const updateCustomerService = async (customerId, updateData) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  const normalizedUpdateData = normalizeCustomerPayload(updateData);

  if (normalizedUpdateData.phone !== undefined) {
    const existingPhoneCustomer = await Customer.findOne({
      phone: normalizedUpdateData.phone,
      _id: { $ne: customerId },
    });

    if (existingPhoneCustomer) {
      throw new ConflictError("A customer with this phone already exists.");
    }
  }

  if (normalizedUpdateData.email !== undefined && normalizedUpdateData.email) {
    const existingEmailCustomer = await Customer.findOne({
      email: normalizedUpdateData.email,
      _id: { $ne: customerId },
    });

    if (existingEmailCustomer) {
      throw new ConflictError("A customer with this email already exists.");
    }
  }

  Object.assign(customer, normalizedUpdateData);

  try {
    await customer.save();
    return customer;
  } catch (error) {
    handleDuplicateCustomerError(error);
  }
};

export {
  createCustomerService,
  getCustomersService,
  getCustomerByIdService,
  updateCustomerService,
};
