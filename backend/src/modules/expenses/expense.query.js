const expenseQueryConfig = {
  searchableFields: ["description"],
  sortableFields: ["date", "amount", "createdAt"],
  filterableFields: ["category", "status"],
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
    minAmount: (value) => ({
      field: "amount",
      operator: "$gte",
      value: Number(value),
    }),
    maxAmount: (value) => ({
      field: "amount",
      operator: "$lte",
      value: Number(value),
    }),
  },
};

export default expenseQueryConfig;
