import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Employee from "../src/modules/employees/employee.model.js";
import EmployeeRate from "../src/modules/employeeRates/employeeRate.model.js";
import Attendance from "../src/modules/attendances/attendance.model.js";
import Overtime from "../src/modules/overtimes/overtime.model.js";
import WeeklyPayroll from "../src/modules/weeklyPayrolls/weeklyPayroll.model.js";

import { createEmployeeService } from "../src/modules/employees/employee.service.js";
import { createEmployeeRateService } from "../src/modules/employeeRates/employeeRate.service.js";
import { createAttendanceService, updateAttendanceService } from "../src/modules/attendances/attendance.service.js";
import { createOvertimeService, updateOvertimeService } from "../src/modules/overtimes/overtime.service.js";
import { closeEmployeeWeeklyPayrollService } from "../src/modules/weeklyPayrolls/weeklyPayroll.service.js";
import connectDatabase from "../src/core/database/mongodb.js";

test("Payroll Integrity Test Suite", async (t) => {
  let employeeId;
  let inactiveEmployeeId;
  let attendanceId;
  let overtimeId;

  // Use local dates to avoid UTC offset issues during tests
  // Use dates in the past so new Date() doesn't clip the payroll period!
  const mondayDate = new Date(2026, 6, 20); // July 20, 2026 (Mon)
  const saturdayDate = new Date(2026, 6, 25); // July 25, 2026 (Sat)
  const sundayDate = new Date(2026, 6, 26); // July 26, 2026 (Sun)
  const startMonthDate = new Date(2026, 6, 20);

  await t.test("Setup database connection", async () => {
    let connected = false;
    for (let i = 0; i < 5; i++) {
      try {
        await connectDatabase();
        connected = true;
        break;
      } catch (err) {
        console.log(`Connection attempt ${i + 1} failed: ${err.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    if (!connected) throw new Error("Failed to connect to database after 5 attempts");

    await Employee.deleteMany({});
    await EmployeeRate.deleteMany({});
    await Attendance.deleteMany({});
    await Overtime.deleteMany({});
    await WeeklyPayroll.deleteMany({});

    const employee = await createEmployeeService({
      name: "Payroll Test Employee",
      phone: "0999999991",
      employmentStartDate: startMonthDate,
    });
    employeeId = employee._id;

    const inactiveEmployee = await createEmployeeService({
      name: "Inactive Employee",
      phone: "0999999992",
      employmentStartDate: startMonthDate,
    });
    inactiveEmployee.status = "inactive";
    await inactiveEmployee.save();
    inactiveEmployeeId = inactiveEmployee._id;

    await createEmployeeRateService({
      employee: employeeId,
      dailyRate: 100,
      effectiveDate: startMonthDate,
    });
  });

  await t.test("1 & 4. Active employee can create attendance on Monday-Saturday", async () => {
    const attendance = await createAttendanceService({
      employee: employeeId.toString(),
      workDate: mondayDate,
      morningStatus: "PRESENT",
      afternoonStatus: "PRESENT",
    });
    assert.ok(attendance._id);
    attendanceId = attendance._id;
  });

  await t.test("2. Inactive employee cannot create attendance", async () => {
    await assert.rejects(
      createAttendanceService({
        employee: inactiveEmployeeId.toString(),
        workDate: mondayDate,
        morningStatus: "PRESENT",
        afternoonStatus: "PRESENT",
      }),
      (err) => err.message.includes("inactive employee")
    );
  });

  await t.test("3. Sunday attendance remains rejected", async () => {
    await assert.rejects(
      createAttendanceService({
        employee: employeeId.toString(),
        workDate: sundayDate,
        morningStatus: "PRESENT",
        afternoonStatus: "PRESENT",
      }),
      (err) => err.message.includes("Monday through Saturday")
    );
  });

  await t.test("8 & 11. Active employee can create overtime on Monday-Saturday", async () => {
    const overtime = await createOvertimeService({
      employee: employeeId.toString(),
      workDate: mondayDate,
      duration: "HALF_DAY",
    });
    assert.ok(overtime._id);
    overtimeId = overtime._id;
  });

  await t.test("9. Inactive employee cannot create overtime", async () => {
    await assert.rejects(
      createOvertimeService({
        employee: inactiveEmployeeId.toString(),
        workDate: saturdayDate,
        duration: "FULL_DAY",
      }),
      (err) => err.message.includes("inactive employee")
    );
  });

  await t.test("10. Sunday overtime is allowed", async () => {
    const overtime = await createOvertimeService({
      employee: employeeId.toString(),
      workDate: sundayDate,
      duration: "FULL_DAY",
    });
    assert.ok(overtime._id);
  });

  await t.test("Setup rest of the week attendance for payroll closure", async () => {
    // Fill the rest of the week (Tue-Sat) to allow payroll closing
    const dates = [21, 22, 23, 24, 25];
    for (const d of dates) {
      await createAttendanceService({
        employee: employeeId.toString(),
        workDate: new Date(2026, 6, d),
        morningStatus: "PRESENT",
        afternoonStatus: "PRESENT",
      });
    }
  });

  await t.test("16 & 17. Close WeeklyPayroll and verify totalEarnings", async () => {
    // Create an end date to bound the payroll
    const employee = await Employee.findById(employeeId);
    employee.employmentEndDate = sundayDate;
    await employee.save();

    const payroll = await closeEmployeeWeeklyPayrollService(employeeId.toString());
    assert.strictEqual(payroll.status, "CLOSED");
    // 6 days of attendance (Mon-Sat) * 100 = 600
    // Overtime: Monday HALF_DAY (100) + Sunday FULL_DAY (200) = 300
    // Total = 900
    assert.strictEqual(payroll.totalEarnings, 900);
  });

  await t.test("18, 19, 20. Attempt to modify contributing Attendance/Overtime is rejected", async () => {
    // Try to update attendance
    await assert.rejects(
      updateAttendanceService(attendanceId.toString(), { morningStatus: "ABSENT" }),
      (err) => err.message.includes("closed payroll")
    );

    // Try to update overtime
    await assert.rejects(
      updateOvertimeService(overtimeId.toString(), { duration: "FULL_DAY" }),
      (err) => err.message.includes("closed payroll")
    );

    // Try to create new overtime in closed period
    await assert.rejects(
      createOvertimeService({
        employee: employeeId.toString(),
        workDate: saturdayDate,
        duration: "HALF_DAY",
      }),
      (err) => err.message.includes("closed payroll")
    );
  });

  await t.test("7 & 15. Existing attendance and overtime remain readable", async () => {
    const attendance = await Attendance.findById(attendanceId);
    assert.ok(attendance);
    assert.strictEqual(attendance.morningStatus, "PRESENT");

    const overtime = await Overtime.findById(overtimeId);
    assert.ok(overtime);
    assert.strictEqual(overtime.duration, "HALF_DAY");
  });

  await t.test("21. Verify closed payroll total remains unchanged", async () => {
    const payroll = await WeeklyPayroll.findOne({ employee: employeeId, status: "CLOSED" });
    assert.strictEqual(payroll.totalEarnings, 900);
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});
