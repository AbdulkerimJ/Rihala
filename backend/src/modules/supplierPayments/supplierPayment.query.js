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
};

export default supplierPaymentQueryConfig;
