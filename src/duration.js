const DURATION_RE = /^(?<value>\d+(?:\.\d+)?)(?<unit>ms|s|m|h)?$/i;

const UNIT_TO_SECONDS = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 3600,
};

export function parseDurationToSeconds(input, fieldName = "duration") {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error(`${fieldName} must be a non-empty duration string.`);
  }

  const normalized = input.trim().toLowerCase();
  const match = normalized.match(DURATION_RE);

  if (!match || !match.groups) {
    throw new Error(`${fieldName} must look like 30s, 15m, 2h, or 500ms.`);
  }

  const value = Number(match.groups.value);
  const unit = match.groups.unit ?? "s";

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive duration.`);
  }

  return value * UNIT_TO_SECONDS[unit];
}
