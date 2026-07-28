import assert from "node:assert/strict";
import test from "node:test";
import { nextGateProgress } from "../lib/assessment-flow.js";

const FOUNDATION_GATES = [
  "Problem Clarity",
  "Stakeholder Validation",
  "Change Readiness",
];

test("scores 1 and 2 always advance to a renderable screen after recording the gap", () => {
  for (const score of [1, 2]) {
    FOUNDATION_GATES.forEach((label, gateIndex) => {
      const next = nextGateProgress(gateIndex, FOUNDATION_GATES.length);
      const expected = gateIndex < FOUNDATION_GATES.length - 1
        ? { gateIndex: gateIndex + 1, step: "gates" }
        : { gateIndex, step: "scoring" };

      assert.deepEqual(next, expected, `${label} at ${score}/5`);
      assert.notEqual(next.step, "gateWarning", `${label} at ${score}/5 must leave the warning screen`);
    });
  }
});
