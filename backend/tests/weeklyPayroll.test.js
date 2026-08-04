import test from "node:test";
import assert from "node:assert/strict";

import WeeklyPayroll from "../src/modules/weeklyPayrolls/weeklyPayroll.model.js";
import Attendance from "../src/modules/attendances/attendance.model.js";
import Overtime from "../src/modules/overtimes/overtime.model.js";
import EmployeeRate from "../src/modules/employeeRates/employeeRate.model.js";
import Employee from "../src/modules/employees/employee.model.js";
import {
  getCurrentPayrollCalculationService,
  closeEmployeeWeeklyPayrollService,
} from "../src/modules/weeklyPayrolls/weeklyPayroll.service.js";
import ValidationError from "../src/core/errors/ValidationError.js";
import ConflictError from "../src/core/errors/ConflictError.js";

const today = new Date("2026-08-11");
const originalDate = Date.now;

const stubDate = () => {
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(today);
      } else {
        super(...args);
      }
    }
  };
};

test.beforeEach(() => {
  stubDate();
});

test.afterEach(() => {
  global.Date = Date;
});

test("current payroll calculation uses the employee start date when there is no previous closed payroll", async () => {
  const originalEmployeeFindById = Employee.findById;
  const originalWeeklyPayrollFindOne = WeeklyPayroll.findOne;
  const originalAttendanceFind = Attendance.find;
  const originalOvertimeFind = Overtime.find;
  const originalEmployeeRateFind = EmployeeRate.find;

  Employee.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    employmentStartDate: new Date("2026-08-03"),
    employmentEndDate: null,
  });
  WeeklyPayroll.findOne = (query) => {
    return {
      sort: async () => null,
      then: (resolve) => resolve(null)
    };
  };
  Attendance.find = async () => [];
  Overtime.find = async () => [];
  EmployeeRate.find = () => ({
    sort: async () => [{ dailyRate: 500, effectiveDate: new Date("2026-08-01"), employee: { name: "Ahmed" } }],
  });

  try {
    const result = await getCurrentPayrollCalculationService(
      "507f1f77bcf86cd799439011",
    );

    assert.equal(result.startDate.toISOString().slice(0, 10), "2026-08-03");
    assert.equal(result.endDate.toISOString().slice(0, 10), "2026-08-11");
    assert.equal(result.normalEarnings, 0);
    assert.equal(result.totalEarnings, 0);
  } finally {
    Employee.findById = originalEmployeeFindById;
    WeeklyPayroll.findOne = originalWeeklyPayrollFindOne;
    Attendance.find = originalAttendanceFind;
    Overtime.find = originalOvertimeFind;
    EmployeeRate.find = originalEmployeeRateFind;
  }
});

test("current payroll calculation uses the day after the latest closed payroll as the start date", async () => {
  const originalEmployeeFindById = Employee.findById;
  const originalWeeklyPayrollFindOne = WeeklyPayroll.findOne;
  const originalAttendanceFind = Attendance.find;
  const originalOvertimeFind = Overtime.find;
  const originalEmployeeRateFind = EmployeeRate.find;

  Employee.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    employmentStartDate: new Date("2026-08-01"),
    employmentEndDate: null,
  });
  WeeklyPayroll.findOne = (query) => {
    return {
      sort: async () => ({ endDate: new Date("2026-08-08") }),
      then: (resolve) => resolve(null)
    };
  };
  Attendance.find = async () => [];
  Overtime.find = async () => [];
  EmployeeRate.find = () => ({
    sort: async () => [{ dailyRate: 500, effectiveDate: new Date("2026-08-01"), employee: { name: "Ahmed" } }],
  });

  try {
    const result = await getCurrentPayrollCalculationService(
      "507f1f77bcf86cd799439011",
    );

    assert.equal(result.startDate.toISOString().slice(0, 10), "2026-08-09");
  } finally {
    Employee.findById = originalEmployeeFindById;
    WeeklyPayroll.findOne = originalWeeklyPayrollFindOne;
    Attendance.find = originalAttendanceFind;
    Overtime.find = originalOvertimeFind;
    EmployeeRate.find = originalEmployeeRateFind;
  }
});

test("closing blocks when attendance is missing for required work dates", async () => {
  const originalEmployeeFindById = Employee.findById;
  const originalWeeklyPayrollFindOne = WeeklyPayroll.findOne;
  const originalAttendanceFind = Attendance.find;
  const originalOvertimeFind = Overtime.find;
  const originalEmployeeRateFind = EmployeeRate.find;

  Employee.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    employmentStartDate: new Date("2026-08-10"),
    employmentEndDate: null,
  });
  WeeklyPayroll.findOne = (query) => {
    return {
      sort: async () => null,
      then: (resolve) => resolve(null)
    };
  };
  Attendance.find = async () => [
    {
      employee: "507f1f77bcf86cd799439011",
      workDate: new Date("2026-08-10"),
      morningStatus: "PRESENT",
      afternoonStatus: "PRESENT",
    },
  ];
  Overtime.find = async () => [];
  EmployeeRate.find = () => ({
    sort: async () => [{ dailyRate: 500, effectiveDate: new Date("2026-08-01"), employee: { name: "Ahmed" } }],
  });

  try {
    await assert.rejects(
      () => closeEmployeeWeeklyPayrollService("507f1f77bcf86cd799439011"),
      (error) => {
        assert.ok(error instanceof ValidationError);
        assert.match(error.message, /attendance/i);
        assert.ok(error.errors?.some((entry) => entry.field === "attendance"));
        return true;
      },
    );
  } finally {
    Employee.findById = originalEmployeeFindById;
    WeeklyPayroll.findOne = originalWeeklyPayrollFindOne;
    Attendance.find = originalAttendanceFind;
    Overtime.find = originalOvertimeFind;
    EmployeeRate.find = originalEmployeeRateFind;
  }
});

test("closing creates a finalized payroll snapshot with earnings and a closed timestamp", async () => {
  const originalEmployeeFindById = Employee.findById;
  const originalWeeklyPayrollFindOne = WeeklyPayroll.findOne;
  const originalAttendanceFind = Attendance.find;
  const originalOvertimeFind = Overtime.find;
  const originalEmployeeRateFind = EmployeeRate.find;
  const originalCreate = WeeklyPayroll.create;

  Employee.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    employmentStartDate: new Date("2026-08-10"),
    employmentEndDate: null,
  });
  WeeklyPayroll.findOne = (query) => {
    return {
      sort: async () => null,
      then: (resolve) => resolve(null)
    };
  };
  Attendance.find = async () => [
    {
      employee: "507f1f77bcf86cd799439011",
      workDate: new Date("2026-08-10"),
      morningStatus: "PRESENT",
      afternoonStatus: "PRESENT",
    },
    {
      employee: "507f1f77bcf86cd799439011",
      workDate: new Date("2026-08-11"),
      morningStatus: "PRESENT",
      afternoonStatus: "ABSENT",
    },
  ];
  Overtime.find = async () => [
    {
      workDate: new Date("2026-08-11"),
      amount: 1000,
    },
  ];
  EmployeeRate.find = () => ({
    sort: async () => [{ dailyRate: 500, effectiveDate: new Date("2026-08-01"), employee: { name: "Ahmed" } }],
  });
  WeeklyPayroll.create = async (payload) => ({
    ...payload,
    _id: "weekly-payroll-1",
    populate: async () => ({
      ...payload,
      _id: "weekly-payroll-1",
      employee: { name: "Ahmed" },
    }),
  });

  try {
    const result = await closeEmployeeWeeklyPayrollService(
      "507f1f77bcf86cd799439011",
    );

    assert.equal(result.status, "CLOSED");
    assert.equal(result.normalEarnings, 750);
    assert.equal(result.overtimeEarnings, 1000);
    assert.equal(result.totalEarnings, 1750);
    assert.ok(result.closedAt instanceof Date);
  } finally {
    Employee.findById = originalEmployeeFindById;
    WeeklyPayroll.findOne = originalWeeklyPayrollFindOne;
    Attendance.find = originalAttendanceFind;
    Overtime.find = originalOvertimeFind;
    EmployeeRate.find = originalEmployeeRateFind;
    WeeklyPayroll.create = originalCreate;
  }
});

test("closing rejects a duplicate payroll period for the same employee", async () => {
  const originalEmployeeFindById = Employee.findById;
  const originalWeeklyPayrollFindOne = WeeklyPayroll.findOne;
  const originalAttendanceFind = Attendance.find;
  const originalOvertimeFind = Overtime.find;
  const originalEmployeeRateFind = EmployeeRate.find;

  Employee.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    employmentStartDate: new Date("2026-08-10"),
    employmentEndDate: null,
  });
  WeeklyPayroll.findOne = (query) => {
    if (query?.status === "CLOSED") {
      return {
        sort: async () => null,
        then: (resolve) => resolve(null)
      };
    }
    return {
      sort: async () => null,
      then: (resolve) => resolve({ _id: "existing", endDate: new Date("2026-08-11") })
    };
  };
  Attendance.find = async () => [];
  Overtime.find = async () => [];
  EmployeeRate.find = () => ({
    sort: async () => [{ dailyRate: 500, effectiveDate: new Date("2026-08-01"), employee: { name: "Ahmed" } }],
  });

  try {
    await assert.rejects(
      () => closeEmployeeWeeklyPayrollService("507f1f77bcf86cd799439011"),
      (error) => {
        assert.ok(error instanceof ConflictError);
        return true;
      },
    );
  } finally {
    Employee.findById = originalEmployeeFindById;
    WeeklyPayroll.findOne = originalWeeklyPayrollFindOne;
    Attendance.find = originalAttendanceFind;
    Overtime.find = originalOvertimeFind;
    EmployeeRate.find = originalEmployeeRateFind;
  }
});
