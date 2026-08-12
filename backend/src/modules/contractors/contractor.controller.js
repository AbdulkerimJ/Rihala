import catchAsync from "../../core/utils/catchAsync.js";
import * as contractorService from "./contractor.service.js";

const createContractor = catchAsync(async (req, res) => {
  const contractor = await contractorService.createContractorService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: {
      contractor,
    },
  });
});

const getContractors = catchAsync(async (req, res) => {
  const result = await contractorService.getContractorsService(req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getContractorById = catchAsync(async (req, res) => {
  const contractor = await contractorService.getContractorByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: {
      contractor,
    },
  });
});

const updateContractor = catchAsync(async (req, res) => {
  const contractor = await contractorService.updateContractorService(
    req.validatedParams.id,
    req.validatedBody
  );

  res.status(200).json({
    status: "success",
    data: {
      contractor,
    },
  });
});

const deleteContractor = catchAsync(async (req, res) => {
  await contractorService.deleteContractorService(req.validatedParams.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export {
  createContractor,
  getContractors,
  getContractorById,
  updateContractor,
  deleteContractor,
};
