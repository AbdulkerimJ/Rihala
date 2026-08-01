const customerQueryConfig = {
  searchableFields: ["name", "phone", "email"],
  sortableFields: ["name", "createdAt", "updatedAt"],
  filterableFields: ["status"],
  defaultSort: "name",
};

export default customerQueryConfig;
