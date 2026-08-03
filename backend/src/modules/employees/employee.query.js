const employeeQueryConfig = {
  searchableFields: ["name", "phone"],
  sortableFields: ["name", "status", "employmentStartDate", "createdAt"],
  filterableFields: ["status"],
  defaultSort: "-createdAt",
};

export default employeeQueryConfig;
