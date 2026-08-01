import test from "node:test";
import assert from "node:assert/strict";
import {
  generateInvitationCode,
  compareHashedToken,
  hashToken,
} from "../src/core/utils/token.js";

test("generateInvitationCode returns a 4-digit string", () => {
  const code = generateInvitationCode();

  assert.match(code, /^\d{4}$/);
});

test("compareHashedToken validates the matching invitation code", () => {
  const code = generateInvitationCode();
  const codeHash = hashToken(code);

  assert.equal(compareHashedToken(code, codeHash), true);
  assert.equal(compareHashedToken("0000", codeHash), false);
});
