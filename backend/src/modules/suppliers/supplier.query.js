const supplierQueryConfig = {
  searchableFields: ["name", "phone", "address"],
  filterableFields: ["status"],
  sortableFields: ["name", "createdAt", "updatedAt", "status"],
  defaultSort: "-createdAt",
};

export default supplierQueryConfig;
