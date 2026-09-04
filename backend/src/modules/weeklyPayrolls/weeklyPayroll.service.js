import mongoose from "mongoose";
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
import { normalizeDateValue, isWorkday } from "../../core/utils/date.js";
import Counter from "../../core/models/counter.model.js";
import EmployeePayment from "../employeePayments/employeePayment.model.js";

const getLatestClosedPayroll = async (employeeId, session = null) => {
  return WeeklyPayroll.findOne({
    employee: employeeId,

  }).sort({ endDate: -1 }).session(session);
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
      const isPastOrToday = cursor <= normalizeDateValue(new Date());

      if (isWithinEmploymentPeriod && isPastOrToday) {
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
  session = null,
) => {
  const requiredDates = buildRequiredAttendanceDates(
    startDate,
    periodEndDate,
    employee,
  );

  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    workDate: { $gte: startDate, $lte: periodEndDate },
  }).session(session);

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
  }).session(session);

  let normalEarnings = 0;
  const dailyBreakdown = [];

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
        `No applicable employee rate found for ${currentDate.toISOString().slice(0, 10)}.`,
      );
    }

    const dailyPortion = calculateDailyAttendancePortion(
      record.morningStatus,
      record.afternoonStatus,
    );

    const dayEarnings = dailyPortion * applicableRate.dailyRate;
    normalEarnings += dayEarnings;

    dailyBreakdown.push({
      workDate: currentDate,
      morningStatus: record.morningStatus,
      afternoonStatus: record.afternoonStatus,
      portion: dailyPortion,
      dailyRate: applicableRate.dailyRate,
      earnings: dayEarnings,
    });
  }

  const overtimeRecords = await Overtime.find({
    employee: employeeId,
    workDate: { $gte: startDate, $lte: periodEndDate },
  }).session(session);

  let overtimeEarnings = 0;
  const overtimeBreakdown = [];

  for (const record of overtimeRecords) {
    const applicableRate = rateHistory.find(
      (rate) => rate.effectiveDate <= record.workDate,
    );

    if (!applicableRate) {
      throw new NotFoundError(
        `No applicable employee rate found for overtime on ${record.workDate.toISOString().slice(0, 10)}.`,
      );
    }

    const durationFactor = record.duration === "HALF_DAY" ? 0.5 : 1;
    const earnings = applicableRate.dailyRate * 2 * durationFactor;

    overtimeEarnings += earnings;
    overtimeBreakdown.push({
      workDate: record.workDate,
      duration: record.duration,
      multiplier: durationFactor * 2,
      dailyRate: applicableRate.dailyRate,
      earnings,
    });
  }

  const hasProcessedDays = dailyBreakdown.length > 0 || overtimeBreakdown.length > 0;
  const isComplete = missingAttendanceDates.length === 0 && hasProcessedDays;

  return {
    missingAttendanceDates,
    isComplete,
    hasProcessedDays,
    normalEarnings,
    overtimeEarnings,
    totalEarnings: normalEarnings + overtimeEarnings,
    dailyBreakdown,
    overtimeBreakdown,
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

    isComplete: payrollData.isComplete,
    hasProcessedDays: payrollData.hasProcessedDays,
    missingAttendanceDates: payrollData.missingAttendanceDates,
    dailyBreakdown: payrollData.dailyBreakdown,
    overtimeBreakdown: payrollData.overtimeBreakdown,
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

const closeEmployeeWeeklyPayrollService = async (employeeId, data = {}) => {
  // Resolve employee outside the transaction (read-only, no financial impact).
  const employee = await ensureEmployeeExists(employeeId);

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // Re-read the latest closed payroll inside the transaction so the
      // period boundaries are consistent with the data we're about to snapshot.
      const latestClosedPayroll = await getLatestClosedPayroll(employeeId, session);

      const startDate = await getCurrentPayrollStartDate(employee, latestClosedPayroll);
      const { endDate } = getPayrollPeriodBounds(employee, new Date());
      const periodEndDate = endDate < startDate ? startDate : endDate;

      // Check for existing closed payroll within the transaction (prevents duplicate).
      const existingClosedPayroll = await WeeklyPayroll.findOne({
        employee: employeeId,
        startDate,
        endDate: periodEndDate,
      }).session(session);

      if (existingClosedPayroll) {
        const msg = "This weekly payroll has already been closed.";
        throw new ConflictError(msg, [{ field: "startDate", message: msg }]);
      }

      // Calculate payroll data inside the transaction so attendance/overtime reads
      // are consistent with the transaction snapshot — any concurrent modification
      // will either conflict or be excluded from this snapshot.
      const payrollData = await calculatePayrollData(
        employee,
        employeeId,
        startDate,
        periodEndDate,
        session,
      );

      if (payrollData.missingAttendanceDates.length > 0) {
        throw new ValidationError(
          "Payroll cannot be closed because attendance is missing for required dates.",
          [
            {
              field: "attendance",
              message: `Attendance is missing for the following dates: ${payrollData.missingAttendanceDates
                .map((date) => date.toISOString().slice(0, 10))
                .join(", ")}`,
            },
          ],
        );
      }

      if (!payrollData.hasProcessedDays) {
        throw new ValidationError(
          "Cannot close an empty payroll with no processed attendance or overtime.",
        );
      }

      try {
        const createdPayroll = await WeeklyPayroll.create(
          [
            {
              employee: employeeId,
              startDate,
              endDate: periodEndDate,
              normalEarnings: payrollData.normalEarnings,
              overtimeEarnings: payrollData.overtimeEarnings,
              totalEarnings: payrollData.totalEarnings,
              dailyBreakdown: payrollData.dailyBreakdown,
              overtimeBreakdown: payrollData.overtimeBreakdown,

              closedAt: new Date(),
            },
          ],
          { session },
        );

        if (data?.initialPayment) {
          if (data.initialPayment.amount > payrollData.totalEarnings) {
            throw new ValidationError(`Payment (${data.initialPayment.amount}) cannot exceed total earnings for this period (${payrollData.totalEarnings})`);
          }
          
          const counter = await Counter.findOneAndUpdate(
            { _id: "paymentReference" },
            { $inc: { seq: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
            { session }
          );
          const paymentReference = `PAY-${counter.seq + 1000}`;
          
          await EmployeePayment.create([{
            employee: employeeId,
            employeeName: employee.name,
            paymentReference,
            amount: data.initialPayment.amount,
            paymentDate: data.initialPayment.paymentDate,
            type: "regular",
            note: data.initialPayment.note,
            status: "active",
          }], { session });
        }

        return createdPayroll[0].populate("employee");
      } catch (error) {
        if (error.code === 11000) {
          const msg = "This weekly payroll has already been closed.";
          throw new ConflictError(msg, [{ field: "startDate", message: msg }]);
        }
        throw error;
      }
    });
  } finally {
    session.endSession();
  }
};

export {
  getCurrentPayrollCalculationService,
  getWeeklyPayrollsService,
  getWeeklyPayrollByIdService,
  closeEmployeeWeeklyPayrollService,
};
