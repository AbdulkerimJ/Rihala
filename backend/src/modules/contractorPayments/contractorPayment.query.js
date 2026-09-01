const contractorPaymentQueryConfig = {
  searchableFields: ["paymentReference", "note", "voidReason"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["contract", "status"],
  defaultSort: "-paymentDate",
  populate: [
    { path: "contract", populate: { path: "contractor", select: "name" } },
    { path: "createdBy", select: "name" },
    { path: "voidedBy", select: "name" }
  ],
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

export default contractorPaymentQueryConfig;
