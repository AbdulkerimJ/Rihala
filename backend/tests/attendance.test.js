import test from "node:test";
import assert from "node:assert/strict";
import { calculateDailyAttendancePortion } from "../src/modules/attendances/attendance.service.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../src/modules/attendances/attendance.validation.js";

test("calculateDailyAttendancePortion returns 1 for full presence", () => {
  assert.equal(calculateDailyAttendancePortion("PRESENT", "PRESENT"), 1);
});

test("calculateDailyAttendancePortion returns 0.5 for morning-only presence", () => {
  assert.equal(calculateDailyAttendancePortion("PRESENT", "ABSENT"), 0.5);
});

test("calculateDailyAttendancePortion returns 0.5 for afternoon-only presence", () => {
  assert.equal(calculateDailyAttendancePortion("ABSENT", "PRESENT"), 0.5);
});

test("calculateDailyAttendancePortion returns 0.5 for permission with presence", () => {
  assert.equal(calculateDailyAttendancePortion("PERMISSION", "PRESENT"), 0.5);
});

test("calculateDailyAttendancePortion returns 0.5 for presence with permission", () => {
  assert.equal(calculateDailyAttendancePortion("PRESENT", "PERMISSION"), 0.5);
});

test("calculateDailyAttendancePortion returns 0 for full absence", () => {
  assert.equal(calculateDailyAttendancePortion("ABSENT", "ABSENT"), 0);
});

test("calculateDailyAttendancePortion returns 0 for full permission", () => {
  assert.equal(calculateDailyAttendancePortion("PERMISSION", "PERMISSION"), 0);
});

test("createAttendanceSchema rejects Sunday", () => {
  const result = createAttendanceSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    workDate: "2026-08-02",
    morningStatus: "PRESENT",
    afternoonStatus: "ABSENT",
  });

  assert.equal(result.success, false);
});

test("createAttendanceSchema rejects invalid status", () => {
  const result = createAttendanceSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    workDate: "2026-08-03",
    morningStatus: "REST",
    afternoonStatus: "PRESENT",
  });

  assert.equal(result.success, false);
});

test("updateAttendanceSchema accepts morning status updates", () => {
  const result = updateAttendanceSchema.safeParse({
    morningStatus: "PRESENT",
  });

  assert.equal(result.success, true);
});

test("updateAttendanceSchema accepts afternoon status updates", () => {
  const result = updateAttendanceSchema.safeParse({
    afternoonStatus: "PERMISSION",
  });

  assert.equal(result.success, true);
});

test("updateAttendanceSchema accepts updating both statuses", () => {
  const result = updateAttendanceSchema.safeParse({
    morningStatus: "ABSENT",
    afternoonStatus: "PRESENT",
  });

  assert.equal(result.success, true);
});

test("updateAttendanceSchema rejects employee updates", () => {
  const result = updateAttendanceSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
  });

  assert.equal(result.success, false);
});

test("updateAttendanceSchema rejects workDate updates", () => {
  const result = updateAttendanceSchema.safeParse({
    workDate: "2026-08-10",
  });

  assert.equal(result.success, false);
});

test("updateAttendanceSchema rejects unknown fields", () => {
  const result = updateAttendanceSchema.safeParse({
    note: "unexpected",
  });

  assert.equal(result.success, false);
});

test("updateAttendanceSchema rejects empty updates", () => {
  const result = updateAttendanceSchema.safeParse({});

  assert.equal(result.success, false);
});
