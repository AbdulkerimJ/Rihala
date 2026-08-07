const userQueryConfig = {
  searchableFields: ["name", "email"],
  sortableFields: ["name", "email", "createdAt", "status"],
  filterableFields: ["status"],
  defaultSort: "name",
};

export default userQueryConfig;
