const purchaseQueryConfig = {
  searchFields: ["purchaseNumber"],
  filterableFields: ["supplier", "paymentStatus"],
  sortableFields: ["date", "createdAt", "updatedAt", "totalAmount", "purchaseNumber"],
  defaultSort: "-date",
  populate: [
    { path: "supplier", select: "name phone" },
    { path: "items.material", select: "name category unit" },
  ],
};

export default purchaseQueryConfig;
