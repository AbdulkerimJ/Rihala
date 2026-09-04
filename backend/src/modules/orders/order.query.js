import { buildDateRangeTransforms } from "../../core/utils/query.js";
const orderQueryConfig = {
  searchableFields: ["orderNumber", "customerName", "customerPhone", "description"],
  sortableFields: ["createdAt", "date", "expectedCompletionDate", "agreedAmount", "orderNumber"],
  filterableFields: ["status", "customer", "createdBy"],
  defaultSort: "-createdAt",
  filterTransforms: {
    ...buildDateRangeTransforms("date"),
    
    
  },
};

export default orderQueryConfig;
