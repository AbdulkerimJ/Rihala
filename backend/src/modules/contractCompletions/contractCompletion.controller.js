import { catchAsync } from "../../core/utils/catchAsync.js";
import * as contractCompletionService from "./contractCompletion.service.js";

const recordCompletion = catchAsync(async (req, res) => {
  const completion = await contractCompletionService.recordCompletionService(
    req.validatedBody,
    req.user.id
  );

  res.status(201).json({
    status: "success",
    data: {
      completion,
    },
  });
});

const getCompletions = catchAsync(async (req, res) => {
  const result = await contractCompletionService.getCompletionsService(req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getCompletionById = catchAsync(async (req, res) => {
  const completion = await contractCompletionService.getCompletionByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: {
      completion,
    },
  });
});

const voidCompletion = catchAsync(async (req, res) => {
  const completion = await contractCompletionService.voidCompletionService(
    req.validatedParams.id,
    req.validatedBody.voidReason,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: {
      completion,
    },
  });
});

export {
  recordCompletion,
  getCompletions,
  getCompletionById,
  voidCompletion,
};
