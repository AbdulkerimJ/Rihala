const contractorPaymentQueryConfig = {
  searchableFields: ["paymentReference", "note", "voidReason"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["contract", "status"],
  defaultSort: "-paymentDate",
  populate: "contract createdBy voidedBy",
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
