const attendanceQueryConfig = {
  searchableFields: ["employee"],
  sortableFields: ["workDate", "createdAt"],
  filterableFields: ["employee"],
  defaultSort: "-workDate",
  filterTransforms: {
    from: (value) => ({
      field: "workDate",
      operator: "$gte",
      value: new Date(value),
    }),
    to: (value) => ({
      field: "workDate",
      operator: "$lte",
      value: new Date(value),
    }),
  },
};

export default attendanceQueryConfig;
