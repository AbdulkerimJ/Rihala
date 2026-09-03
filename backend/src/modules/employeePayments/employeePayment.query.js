import { buildDateRangeTransforms } from "../../core/utils/query.js";
const employeePaymentQueryConfig = {
  searchableFields: ["note", "paymentReference"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["employee", "type", "status", "paymentReference"],
  defaultSort: "-paymentDate",
  populate: [
    { path: "voidedBy", select: "name" },
  ],
  filterTransforms: {
    ...buildDateRangeTransforms("paymentDate"),
    
    
  },
};

export default employeePaymentQueryConfig;
