const customerPaymentQueryConfig = {
  searchableFields: ["note", "orderNumber"],
  sortableFields: ["paymentDate", "amount", "createdAt"],
  filterableFields: ["order", "status"],
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

export default customerPaymentQueryConfig;
