const orderQueryConfig = {
  searchableFields: ["orderNumber", "customerName", "customerPhone", "items.description"],
  sortableFields: ["createdAt", "date", "expectedCompletionDate", "agreedAmount", "orderNumber"],
  filterableFields: ["status", "customer", "createdBy"],
  defaultSort: "-date",
  filterTransforms: {
    from: (value) => ({
      field: "date",
      operator: "$gte",
      value: new Date(value),
    }),
    to: (value) => ({
      field: "date",
      operator: "$lte",
      value: new Date(value),
    }),
  },
};

export default orderQueryConfig;
