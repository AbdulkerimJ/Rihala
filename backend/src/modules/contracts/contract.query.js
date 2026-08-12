const contractQueryConfig = {
  searchableFields: ["contractNumber", "note"],
  sortableFields: ["contractDate", "expectedCompletionDate", "createdAt", "quantity", "unitPrice"],
  filterableFields: ["contractor", "task", "status"],
  defaultSort: "-contractDate",
  populate: "contractor task createdBy cancelledBy",
  filterTransforms: {
    from: (value) => ({
      field: "contractDate",
      operator: "$gte",
      value: new Date(value),
    }),
    to: (value) => ({
      field: "contractDate",
      operator: "$lte",
      value: new Date(value),
    }),
  },
};

export default contractQueryConfig;
