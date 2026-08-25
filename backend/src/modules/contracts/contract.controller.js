import { catchAsync } from "../../core/utils/catchAsync.js";
import * as contractService from "./contract.service.js";

const createContract = catchAsync(async (req, res) => {
  const contract = await contractService.createContractService(
    req.validatedBody,
    req.user.id
  );

  res.status(201).json({
    status: "success",
    data: {
      contract,
    },
  });
});

const getContracts = catchAsync(async (req, res) => {
  const result = await contractService.getContractsService(req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getContractById = catchAsync(async (req, res) => {
  const contract = await contractService.getContractByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: {
      contract,
    },
  });
});

const cancelContract = catchAsync(async (req, res) => {
  const contract = await contractService.cancelContractService(
    req.validatedParams.id,
    req.validatedBody.cancellationReason,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: {
      contract,
    },
  });
});

export {
  createContract,
  getContracts,
  getContractById,
  cancelContract,
};
