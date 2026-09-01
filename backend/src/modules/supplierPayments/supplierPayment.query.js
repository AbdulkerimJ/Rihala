const supplierPaymentQueryConfig = {
  searchableFields: ["paymentReference"],
  filterableFields: ["supplier", "type", "status"],
  sortableFields: ["date", "createdAt", "updatedAt", "amount"],
  defaultSort: "-date",
  populate: [
    { path: "supplier", select: "name phone" },
    { path: "allocations.purchase", select: "purchaseNumber date totalAmount allocatedAmount paymentStatus" },
    { path: "voidedBy", select: "name email" },
  ],
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

export default supplierPaymentQueryConfig;
