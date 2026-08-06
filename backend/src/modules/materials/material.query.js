const materialQueryConfig = {
  searchFields: ["name"],
  filterableFields: ["category", "unit", "status"],
  sortableFields: ["name", "createdAt", "updatedAt", "status", "category"],
  defaultSort: "name",
};

export default materialQueryConfig;
