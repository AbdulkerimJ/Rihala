const contractCompletionQueryConfig = {
  searchableFields: ["note", "voidReason"],
  sortableFields: ["recordedAt", "quantity", "createdAt"],
  filterableFields: ["contract", "status"],
  defaultSort: "-recordedAt",
  populate: "contract createdBy voidedBy",
};

export default contractCompletionQueryConfig;
