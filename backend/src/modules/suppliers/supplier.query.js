const supplierQueryConfig = {
  searchableFields: ["name", "phone", "address"],
  filterableFields: ["status"],
  sortableFields: ["name", "createdAt", "updatedAt", "status"],
  defaultSort: "name",
};

export default supplierQueryConfig;
