const expenseQueryConfig = {
  searchableFields: ["description"],
  sortableFields: ["date", "amount", "createdAt"],
  filterableFields: ["category"],
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

export default expenseQueryConfig;
