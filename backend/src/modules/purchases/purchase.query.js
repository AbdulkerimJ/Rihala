import { buildDateRangeTransforms } from "../../core/utils/query.js";
const purchaseQueryConfig = {
  searchableFields: ["purchaseNumber"],
  filterableFields: ["supplier", "paymentStatus"],
  filterTransforms: {
    ...buildDateRangeTransforms("date"),

    paymentStatuses: (val) => ({
      field: "paymentStatus",
      operator: "$in",
      value: val.split(",").map((s) => s.trim()),
    }),
  },
  sortableFields: ["date", "createdAt", "updatedAt", "totalAmount", "purchaseNumber"],
  defaultSort: "-createdAt",
  populate: [
    { path: "supplier", select: "name phone balance" },
    { path: "items.material", select: "name category unit" },
    { path: "createdBy", select: "name email" },
  ],
};

export default purchaseQueryConfig;
