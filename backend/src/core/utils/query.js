import ValidationError from "../errors/ValidationError.js";

const DEFAULTS = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePage = (page, defaultPage = DEFAULTS.defaultPage) => {
  const parsed = Number.parseInt(page, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultPage;
  }

  return parsed;
};

const normalizeLimit = (
  limit,
  defaultLimit = DEFAULTS.defaultLimit,
  maxLimit = DEFAULTS.maxLimit,
) => {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultLimit;
  }

  return Math.min(parsed, maxLimit);
};

const normalizeSort = (sort, allowedFields = [], defaultSort = null) => {
  if (!sort) {
    return defaultSort ? parseSortString(defaultSort, allowedFields) : {};
  }

  return parseSortString(sort, allowedFields);
};

const parseSortString = (sort, allowedFields = []) => {
  const sortEntries = sort
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const sortObject = {};

  sortEntries.forEach((entry) => {
    const descending = entry.startsWith("-");
    const field = descending ? entry.slice(1) : entry;

    if (!allowedFields.includes(field)) {
      throw new ValidationError(`Unsupported sort field: ${field}.`);
    }

    sortObject[field] = descending ? -1 : 1;
  });

  return sortObject;
};

const buildSearchCondition = (search, searchableFields = []) => {
  if (!search || searchableFields.length === 0) {
    return null;
  }

  return {
    $or: searchableFields.map((field) => ({
      [field]: new RegExp(escapeRegExp(search), "i"),
    })),
  };
};

const buildFilterCondition = (input, config = {}) => {
  const filterCondition = {};
  const reservedKeys = new Set(["page", "limit", "search", "sort"]);

  Object.entries(input).forEach(([key, value]) => {
    if (reservedKeys.has(key)) {
      return;
    }

    if (value === undefined || value === null || value === "") {
      return;
    }

    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      throw new ValidationError(`Unsupported filter value for ${key}.`);
    }

    if (config.filterTransforms && config.filterTransforms[key]) {
      const transformed = config.filterTransforms[key](value);
      const { field, operator, value: transformedValue } = transformed;

      if (!field || !operator) {
        throw new ValidationError(`Invalid filter configuration for ${key}.`);
      }

      if (!filterCondition[field]) {
        filterCondition[field] = {};
      }

      filterCondition[field][operator] = transformedValue;
      return;
    }

    if (!config.filterableFields || !config.filterableFields.includes(key)) {
      throw new ValidationError(`Unsupported filter field: ${key}.`);
    }

    filterCondition[key] = value;
  });

  return filterCondition;
};

export const buildQueryOptions = (input = {}, config = {}) => {
  const page = normalizePage(
    input.page,
    config.defaultPage ?? DEFAULTS.defaultPage,
  );
  const limit = normalizeLimit(
    input.limit,
    config.defaultLimit ?? DEFAULTS.defaultLimit,
    config.maxLimit ?? DEFAULTS.maxLimit,
  );

  const search = typeof input.search === "string" ? input.search.trim() : "";

  const filterCondition = buildFilterCondition(input, config);
  const searchCondition = buildSearchCondition(
    search,
    config.searchableFields || [],
  );

  const queryCondition = {
    ...(searchCondition ? searchCondition : {}),
    ...(Object.keys(filterCondition).length > 0 ? filterCondition : {}),
  };

  const sort = normalizeSort(
    input.sort,
    config.sortableFields || [],
    config.defaultSort || null,
  );

  return {
    query: queryCondition,
    pagination: {
      page,
      limit,
      skip: (page - 1) * limit,
    },
    sort,
    search,
  };
};

export const getPaginatedQueryResult = async (
  Model,
  input = {},
  config = {},
  options = {},
) => {
  const queryOptions = buildQueryOptions(input, config);
  const { query, pagination, sort } = queryOptions;

  const finalQuery = { ...query, ...(options.query || {}) };

  const total = await Model.countDocuments(finalQuery);

  let queryBuilder = Model.find(finalQuery)
    .skip(pagination.skip)
    .limit(pagination.limit);

  if (Object.keys(sort).length > 0) {
    queryBuilder = queryBuilder.sort(sort);
  }

  if (options.populate) {
    queryBuilder = queryBuilder.populate(options.populate);
  } else if (config.populate) {
    queryBuilder = queryBuilder.populate(config.populate);
  }

  const data = await queryBuilder;

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    },
  };
};

export const buildDateRangeTransforms = (dateField = "date") => ({
  from: (value) => ({
    field: dateField,
    operator: "$gte",
    value: new Date(value),
  }),
  to: (value) => {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return {
      field: dateField,
      operator: "$lte",
      value: date,
    };
  },
});
