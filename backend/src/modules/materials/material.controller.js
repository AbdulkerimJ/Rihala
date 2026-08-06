import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createMaterialService,
  getMaterialsService,
  getMaterialByIdService,
  updateMaterialService,
} from "./material.service.js";

const getAllMaterialsController = catchAsync(async (req, res) => {
  const result = await getMaterialsService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createMaterialController = catchAsync(async (req, res) => {
  const material = await createMaterialService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: material,
  });
});

const getMaterialByIdController = catchAsync(async (req, res) => {
  const material = await getMaterialByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: material,
  });
});

const updateMaterialController = catchAsync(async (req, res) => {
  const material = await updateMaterialService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: material,
  });
});

export {
  getAllMaterialsController,
  createMaterialController,
  getMaterialByIdController,
  updateMaterialController,
};
