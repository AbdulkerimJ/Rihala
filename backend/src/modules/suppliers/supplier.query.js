const supplierQueryConfig = {
  searchFields: ["name", "phone", "address"],
  filterableFields: ["status"],
  sortableFields: ["name", "createdAt", "updatedAt", "status"],
  defaultSort: "-createdAt",
};

export default supplierQueryConfig;
