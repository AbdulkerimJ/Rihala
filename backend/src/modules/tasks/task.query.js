const taskQueryConfig = {
  searchableFields: ["name"],
  sortableFields: ["name", "defaultUnitPrice", "createdAt"],
  filterableFields: ["taskType", "isActive"],
  defaultSort: "name",
  populate: "taskType",
};

export default taskQueryConfig;
