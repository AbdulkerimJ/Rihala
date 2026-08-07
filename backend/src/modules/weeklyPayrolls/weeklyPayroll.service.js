import WeeklyPayroll from "./weeklyPayroll.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import Attendance from "../attendances/attendance.model.js";
import Overtime from "../overtimes/overtime.model.js";
import EmployeeRate from "../employeeRates/employeeRate.model.js";
import { calculateDailyAttendancePortion } from "../attendances/attendance.service.js";
import weeklyPayrollQueryConfig from "./weeklyPayroll.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const isWorkday = (date) => {
  const day = date.getDay();
  return day >= 1 && day <= 6;
};

const getLatestClosedPayroll = async (employeeId) => {
  return WeeklyPayroll.findOne({
    employee: employeeId,
    status: "CLOSED",
  }).sort({ endDate: -1 });
};

const getPayrollPeriodBounds = (employee, referenceDate = new Date()) => {
  const normalizedReferenceDate = normalizeDateValue(referenceDate);
  const normalizedEmploymentStartDate = normalizeDateValue(
    employee.employmentStartDate,
  );
  const normalizedEmploymentEndDate = normalizeDateValue(
    employee.employmentEndDate,
  );

  const startDate = normalizedEmploymentStartDate;
  const endDate = normalizedEmploymentEndDate
    ? new Date(
        Math.min(
          normalizedEmploymentEndDate.getTime(),
          normalizedReferenceDate.getTime(),
        ),
      )
    : normalizedReferenceDate;

  return {
    startDate,
    endDate,
  };
};

const getCurrentPayrollStartDate = async (employee, latestClosedPayroll) => {
  if (!latestClosedPayroll) {
    return normalizeDateValue(employee.employmentStartDate);
  }

  const normalizedEndDate = normalizeDateValue(latestClosedPayroll.endDate);
  const nextStartDate = new Date(normalizedEndDate.getTime());
  nextStartDate.setDate(nextStartDate.getDate() + 1);

  return nextStartDate;
};

const buildRequiredAttendanceDates = (startDate, endDate, employee) => {
  const dates = [];
  const normalizedStartDate = normalizeDateValue(startDate);
  const normalizedEndDate = normalizeDateValue(endDate);
  const normalizedEmploymentStartDate = normalizeDateValue(
    employee.employmentStartDate,
  );
  const normalizedEmploymentEndDate = normalizeDateValue(
    employee.employmentEndDate,
  );

  const cursor = new Date(normalizedStartDate.getTime());

  while (cursor <= normalizedEndDate) {
    if (isWorkday(cursor)) {
      const isWithinEmploymentPeriod =
        cursor >= normalizedEmploymentStartDate &&
        (!normalizedEmploymentEndDate || cursor <= normalizedEmploymentEndDate);

      if (isWithinEmploymentPeriod) {
        dates.push(new Date(cursor));
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const calculatePayrollData = async (
  employee,
  employeeId,
  startDate,
  periodEndDate,
) => {
  const requiredDates = buildRequiredAttendanceDates(
    startDate,
    periodEndDate,
    employee,
  );

  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    workDate: { $gte: startDate, $lte: periodEndDate },
  });

  const attendanceMap = new Map(
    attendanceRecords.map((record) => [
      record.workDate.toISOString().slice(0, 10),
      record,
    ]),
  );

  const missingAttendanceDates = requiredDates.filter((currentDate) => {
    const key = currentDate.toISOString().slice(0, 10);
    return !attendanceMap.has(key);
  });

  const rateHistory = await EmployeeRate.find({ employee: employeeId }).sort({
    effectiveDate: -1,
  });

  let normalEarnings = 0;

  for (const currentDate of requiredDates) {
    const key = currentDate.toISOString().slice(0, 10);
    const record = attendanceMap.get(key);

    if (!record) {
      continue;
    }

    const applicableRate = rateHistory.find(
      (rate) => rate.effectiveDate <= currentDate,
    );

    if (!applicableRate) {
      throw new NotFoundError(
        "No applicable employee rate found for this date.",
      );
    }

    const dailyPortion = calculateDailyAttendancePortion(
      record.morningStatus,
      record.afternoonStatus,
    );

    normalEarnings += dailyPortion * applicableRate.dailyRate;
  }

  const overtimeRecords = await Overtime.find({
    employee: employeeId,
    workDate: { $gte: startDate, $lte: periodEndDate },
  });

  const overtimeEarnings = overtimeRecords.reduce(
    (sum, record) => sum + (record.amount || 0),
    0,
  );

  return {
    missingAttendanceDates,
    isComplete: missingAttendanceDates.length === 0,
    normalEarnings,
    overtimeEarnings,
    totalEarnings: normalEarnings + overtimeEarnings,
  };
};

const getCurrentPayrollCalculationService = async (employeeId) => {
  const employee = await ensureEmployeeExists(employeeId);
  const latestClosedPayroll = await getLatestClosedPayroll(employeeId);

  const startDate = await getCurrentPayrollStartDate(
    employee,
    latestClosedPayroll,
  );
  const { endDate } = getPayrollPeriodBounds(employee, new Date());
  const periodEndDate = endDate < startDate ? startDate : endDate;

  const payrollData = await calculatePayrollData(
    employee,
    employeeId,
    startDate,
    periodEndDate,
  );

  return {
    employee: employee._id,
    startDate,
    endDate: periodEndDate,
    normalEarnings: payrollData.normalEarnings,
    overtimeEarnings: payrollData.overtimeEarnings,
    totalEarnings: payrollData.totalEarnings,
    status: "OPEN",
    isComplete: payrollData.isComplete,
    missingAttendanceDates: payrollData.missingAttendanceDates,
  };
};

const getWeeklyPayrollsService = async (filters = {}) => {
  return getPaginatedQueryResult(
    WeeklyPayroll,
    filters,
    weeklyPayrollQueryConfig,
    {
      populate: ["employee"],
    },
  );
};

const getWeeklyPayrollByIdService = async (weeklyPayrollId) => {
  const payroll =
    await WeeklyPayroll.findById(weeklyPayrollId).populate("employee");

  if (!payroll) {
    throw new NotFoundError("Weekly payroll not found.");
  }

  return payroll;
};

const closeEmployeeWeeklyPayrollService = async (employeeId) => {
  const employee = await ensureEmployeeExists(employeeId);
  const latestClosedPayroll = await getLatestClosedPayroll(employeeId);

  const startDate = await getCurrentPayrollStartDate(
    employee,
    latestClosedPayroll,
  );
  const { endDate } = getPayrollPeriodBounds(employee, new Date());
  const periodEndDate = endDate < startDate ? startDate : endDate;

  const existingClosedPayroll = await WeeklyPayroll.findOne({
    employee: employeeId,
    startDate,
    endDate: periodEndDate,
  });

  if (existingClosedPayroll) {
    throw new ConflictError("This weekly payroll has already been closed.");
  }

  const payrollData = await calculatePayrollData(
    employee,
    employeeId,
    startDate,
    periodEndDate,
  );

  if (!payrollData.isComplete) {
    throw new ValidationError(
      "Payroll cannot be closed because attendance is missing for required dates.",
      [
        {
          field: "attendance",
          message: `Attendance is missing for the following dates: ${payrollData.missingAttendanceDates.map((date) => date.toISOString().slice(0, 10)).join(", ")}`,
        },
      ],
    );
  }

  try {
    const createdPayroll = await WeeklyPayroll.create({
      employee: employeeId,
      startDate,
      endDate: periodEndDate,
      normalEarnings: payrollData.normalEarnings,
      overtimeEarnings: payrollData.overtimeEarnings,
      totalEarnings: payrollData.totalEarnings,
      status: "CLOSED",
      closedAt: new Date(),
    });

    return createdPayroll.populate("employee");
  } catch (error) {
    if (error.code === 11000) {
      throw new ConflictError("This weekly payroll has already been closed.");
    }
    throw error;
  }
};

export {
  getCurrentPayrollCalculationService,
  getWeeklyPayrollsService,
  getWeeklyPayrollByIdService,
  closeEmployeeWeeklyPayrollService,
};
