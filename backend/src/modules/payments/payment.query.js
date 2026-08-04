const paymentQueryConfig = {
  searchableFields: ["note"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-paymentDate",
  filterTransforms: {
    from: (value) => ({
      field: "paymentDate",
      operator: "$gte",
      value: new Date(value),
    }),
    to: (value) => ({
      field: "paymentDate",
      operator: "$lte",
      value: new Date(value),
    }),
  },
};

export default paymentQueryConfig;
