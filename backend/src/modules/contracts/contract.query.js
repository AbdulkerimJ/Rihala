import { buildDateRangeTransforms } from "../../core/utils/query.js";
const contractQueryConfig = {
  searchableFields: ["contractNumber", "note"],
  sortableFields: ["contractDate", "expectedCompletionDate", "createdAt", "quantity", "unitPrice"],
  filterableFields: ["contractor", "task", "status"],
  defaultSort: "-createdAt",
  populate: "contractor task createdBy cancelledBy",
  filterTransforms: {
    ...buildDateRangeTransforms("contractDate"),
    
    
  },
};

export default contractQueryConfig;
