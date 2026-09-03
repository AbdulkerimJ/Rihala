import { buildDateRangeTransforms } from "../../core/utils/query.js";
const contractorPaymentQueryConfig = {
  searchableFields: ["paymentReference", "note", "voidReason"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["contract", "status"],
  defaultSort: "-paymentDate",
  populate: [
    { path: "contract", populate: { path: "contractor", select: "name" } },
    { path: "createdBy", select: "name" },
    { path: "voidedBy", select: "name" }
  ],
  filterTransforms: {
    ...buildDateRangeTransforms("paymentDate"),
    
    
  },
};

export default contractorPaymentQueryConfig;
