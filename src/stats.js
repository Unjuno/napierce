export function mean(values) {
  const nums = finiteNumbers(values);
  if (nums.length === 0) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

export function standardDeviation(values) {
  const nums = finiteNumbers(values);
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((sum, value) => sum + (value - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

export function percentile(values, p) {
  const nums = finiteNumbers(values).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  if (p <= 0) return nums[0];
  if (p >= 100) return nums[nums.length - 1];

  const rank = (p / 100) * (nums.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);

  if (lower === upper) return nums[lower];

  const weight = rank - lower;
  return nums[lower] * (1 - weight) + nums[upper] * weight;
}

export function round(value, digits = 3) {
  if (value == null) return null;
  return Number(value.toFixed(digits));
}

function finiteNumbers(values) {
  return values.filter((value) => typeof value === "number" && Number.isFinite(value));
}
