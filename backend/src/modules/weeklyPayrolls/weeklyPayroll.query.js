const weeklyPayrollQueryConfig = {
  searchableFields: [],
  sortableFields: ["startDate", "endDate", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-createdAt",
  filterTransforms: {
    from: (value) => ({
      field: "startDate",
      operator: "$gte",
      value: new Date(value),
    }),
    to: (value) => ({
      field: "endDate",
      operator: "$lte",
      value: new Date(value),
    }),
  },
};

export default weeklyPayrollQueryConfig;
