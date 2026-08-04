const weeklyPayrollQueryConfig = {
  searchableFields: ["employee"],
  sortableFields: ["startDate", "endDate", "status", "createdAt"],
  filterableFields: ["employee", "status"],
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
