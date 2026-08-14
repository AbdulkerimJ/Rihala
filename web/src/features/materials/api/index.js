import { createCrudApi } from "../../../api/crud";

const materialsApi = createCrudApi("/materials");

export const getMaterials = materialsApi.getAll;
export const getMaterialById = materialsApi.getById;
export const createMaterial = materialsApi.create;
export const updateMaterial = materialsApi.update;
export const deleteMaterial = materialsApi.delete;

