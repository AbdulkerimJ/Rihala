const purchaseQueryConfig = {
  searchableFields: ["purchaseNumber"],
  filterableFields: ["supplier", "paymentStatus"],
  filterTransforms: {
    from: (val) => ({ field: "date", operator: "$gte", value: new Date(val) }),
    to: (val) => {
      const date = new Date(val);
      date.setHours(23, 59, 59, 999);
      return { field: "date", operator: "$lte", value: date };
    },
    paymentStatuses: (val) => ({
      field: "paymentStatus",
      operator: "$in",
      value: val.split(",").map((s) => s.trim()),
    }),
  },
  sortableFields: ["date", "createdAt", "updatedAt", "totalAmount", "purchaseNumber"],
  defaultSort: "-date",
  populate: [
    { path: "supplier", select: "name phone balance" },
    { path: "items.material", select: "name category unit" },
    { path: "createdBy", select: "name email" },
  ],
};

export default purchaseQueryConfig;
