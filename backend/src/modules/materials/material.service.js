import Material from "./material.model.js";
import materialQueryConfig from "./material.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

const normalizeMaterialPayload = (data = {}) => {
  const normalizedData = { ...data };

  if (
    normalizedData.name !== undefined &&
    typeof normalizedData.name === "string"
  ) {
    normalizedData.name = normalizedData.name.trim();
  }

  return normalizedData;
};

const handleDuplicateMaterialError = (error) => {
  if (error?.code === 11000) {
    const fieldName = Object.keys(error.keyPattern || {})[0] || "field";
    if (fieldName === "name") {
      const msg = "A material with this name already exists.";
      throw new ConflictError(msg, [{ field: "name", message: msg }]);
    }
    const msg = `A material with this ${fieldName} already exists.`;
    throw new ConflictError(msg, [{ field: fieldName, message: msg }]);
  }
  throw error;
};

const createMaterialService = async (data) => {
  const normalizedData = normalizeMaterialPayload(data);

  if (normalizedData.name) {
    // Case-insensitive unique check for material name
    const existingNameMaterial = await Material.findOne({
      name: { $regex: new RegExp(`^${normalizedData.name}$`, "i") },
    });

    if (existingNameMaterial) {
      const msg = "A material with this name already exists.";
      throw new ConflictError(msg, [{ field: "name", message: msg }]);
    }
  }

  try {
    const material = await Material.create(normalizedData);
    return material;
  } catch (error) {
    handleDuplicateMaterialError(error);
  }
};

const getMaterialsService = async (filters = {}) => {
  return getPaginatedQueryResult(Material, filters, materialQueryConfig);
};

const getMaterialByIdService = async (materialId) => {
  const material = await Material.findById(materialId);

  if (!material) {
    throw new NotFoundError("Material not found.");
  }

  return material;
};

const updateMaterialService = async (materialId, updateData) => {
  const material = await Material.findById(materialId);

  if (!material) {
    throw new NotFoundError("Material not found.");
  }

  const normalizedUpdateData = normalizeMaterialPayload(updateData);

  if (normalizedUpdateData.name !== undefined) {
    const existingNameMaterial = await Material.findOne({
      name: { $regex: new RegExp(`^${normalizedUpdateData.name}$`, "i") },
      _id: { $ne: materialId },
    });

    if (existingNameMaterial) {
      const msg = "A material with this name already exists.";
      throw new ConflictError(msg, [{ field: "name", message: msg }]);
    }
  }

  Object.assign(material, normalizedUpdateData);

  try {
    await material.save();
    return material;
  } catch (error) {
    handleDuplicateMaterialError(error);
  }
};

export {
  createMaterialService,
  getMaterialsService,
  getMaterialByIdService,
  updateMaterialService,
};
