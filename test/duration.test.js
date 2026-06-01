import test from "node:test";
import assert from "node:assert/strict";
import { parseDurationToSeconds } from "../src/duration.js";

test("parse seconds by default", () => {
  assert.equal(parseDurationToSeconds("30"), 30);
});

test("parse supported duration units", () => {
  assert.equal(parseDurationToSeconds("500ms"), 0.5);
  assert.equal(parseDurationToSeconds("45s"), 45);
  assert.equal(parseDurationToSeconds("15m"), 900);
  assert.equal(parseDurationToSeconds("2h"), 7200);
});

test("reject invalid durations", () => {
  assert.throws(() => parseDurationToSeconds(""));
  assert.throws(() => parseDurationToSeconds("0s"));
  assert.throws(() => parseDurationToSeconds("abc"));
  assert.throws(() => parseDurationToSeconds("1d"));
});
