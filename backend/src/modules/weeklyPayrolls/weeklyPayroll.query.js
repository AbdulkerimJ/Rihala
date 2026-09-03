import { buildDateRangeTransforms } from "../../core/utils/query.js";
const weeklyPayrollQueryConfig = {
  searchableFields: [],
  sortableFields: ["startDate", "endDate", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-createdAt",
  filterTransforms: {
    ...buildDateRangeTransforms("endDate"),
    
    
  },
};

export default weeklyPayrollQueryConfig;
