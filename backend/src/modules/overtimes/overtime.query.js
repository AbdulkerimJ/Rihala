import { buildDateRangeTransforms } from "../../core/utils/query.js";
const overtimeQueryConfig = {
  searchableFields: ["employee"],
  sortableFields: ["workDate", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-workDate",
  filterTransforms: {
    ...buildDateRangeTransforms("workDate"),
    
    
  },
};

export default overtimeQueryConfig;
