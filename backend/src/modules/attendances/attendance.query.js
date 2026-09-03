import { buildDateRangeTransforms } from "../../core/utils/query.js";
const attendanceQueryConfig = {
  searchableFields: [],
  sortableFields: ["workDate", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-workDate",
  filterTransforms: {
    ...buildDateRangeTransforms("workDate"),
    
    
  },
};

export default attendanceQueryConfig;
