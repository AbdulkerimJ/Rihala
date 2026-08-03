const employeeRateQueryConfig = {
  searchableFields: ["note"],
  sortableFields: ["effectiveDate", "dailyRate", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-effectiveDate",
};

export default employeeRateQueryConfig;
