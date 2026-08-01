const orderQueryConfig = {
  searchableFields: ["description"],
  sortableFields: ["createdAt", "expectedCompletionDate", "agreedAmount"],
  filterableFields: ["status", "customer", "createdBy"],
  defaultSort: "-expectedCompletionDate",
  filterTransforms: {
    from: (value) => ({
      field: "createdAt",
      operator: "$gte",
      value: new Date(value),
    }),
    to: (value) => ({
      field: "createdAt",
      operator: "$lte",
      value: new Date(value),
    }),
  },
};

export default orderQueryConfig;
