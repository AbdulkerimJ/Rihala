import test from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "../src/core/utils/phone.js";

test("normalizePhone converts common Ethiopian formats to the same canonical value", () => {
  assert.equal(normalizePhone("0911234567"), "+251911234567");
  assert.equal(normalizePhone("+251911234567"), "+251911234567");
  assert.equal(normalizePhone("251911234567"), "+251911234567");
});

test("normalizePhone rejects clearly invalid values", () => {
  assert.throws(() => normalizePhone("123"), /valid Ethiopian/i);
  assert.throws(() => normalizePhone("abc"), /valid Ethiopian/i);
});
