import { buildDateRangeTransforms } from "../../core/utils/query.js";
const customerPaymentQueryConfig = {
  searchableFields: ["note", "orderNumber", "customerName"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["order", "status"],
  defaultSort: "-paymentDate",
  populate: [
    { path: "createdBy", select: "name" },
    { path: "voidedBy", select: "name" },
  ],
  filterTransforms: {
    ...buildDateRangeTransforms("paymentDate"),
    
    
    minAmount: (value) => ({
      field: "amount",
      operator: "$gte",
      value: Number(value),
    }),
    maxAmount: (value) => ({
      field: "amount",
      operator: "$lte",
      value: Number(value),
    }),
  },
};

export default customerPaymentQueryConfig;
