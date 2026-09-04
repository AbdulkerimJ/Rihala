import { buildDateRangeTransforms } from "../../core/utils/query.js";
const expenseQueryConfig = {
  searchableFields: ["description"],
  sortableFields: ["date", "amount", "createdAt"],
  filterableFields: ["category", "status"],
  defaultSort: "-createdAt",
  filterTransforms: {
    ...buildDateRangeTransforms("date"),
    
    
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

export default expenseQueryConfig;
