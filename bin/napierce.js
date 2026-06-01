#!/usr/bin/env node

import { parseDurationToSeconds } from "../src/duration.js";
import { createPlan } from "../src/plan.js";
import { formatPlanText } from "../src/format.js";

function main(argv) {
  const [command, ...args] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command !== "plan") {
    throw new Error(`unknown command: ${command}`);
  }

  const options = parseArgs(args);
  const plan = createPlan({
    generationBudgetSeconds: requiredDuration(options, "generate-budget"),
    reviewBudgetSeconds: requiredDuration(options, "review-budget"),
    generationP95Seconds: optionalDuration(options, "generation-p95"),
    generationMeanSeconds: optionalDuration(options, "generation-mean"),
    generationSdSeconds: optionalDuration(options, "generation-sd"),
    reviewP95Seconds: optionalDuration(options, "review-p95"),
    reviewMeanSeconds: optionalDuration(options, "review-mean"),
    reviewSdSeconds: optionalDuration(options, "review-sd"),
    lambda: optionalNumber(options, "lambda"),
    oversample: optionalNumber(options, "oversample"),
  });

  if (options.json === true) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(formatPlanText(plan));
  }
}

function parseArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (!token.startsWith("--")) {
      throw new Error(`unexpected argument: ${token}`);
    }

    const name = token.slice(2);

    if (name === "json") {
      options.json = true;
      continue;
    }

    const value = args[i + 1];
    if (value == null || value.startsWith("--")) {
      throw new Error(`missing value for --${name}`);
    }

    options[name] = value;
    i += 1;
  }

  return options;
}

function requiredDuration(options, name) {
  if (options[name] == null) {
    throw new Error(`--${name} is required.`);
  }
  return parseDurationToSeconds(options[name], `--${name}`);
}

function optionalDuration(options, name) {
  if (options[name] == null) {
    return undefined;
  }
  return parseDurationToSeconds(options[name], `--${name}`);
}

function optionalNumber(options, name) {
  if (options[name] == null) {
    return undefined;
  }

  const value = Number(options[name]);
  if (!Number.isFinite(value)) {
    throw new Error(`--${name} must be a number.`);
  }

  return value;
}

function printHelp() {
  console.log(`Napierce

Usage:
  napierce plan --generate-budget 20m --generation-p95 30s --review-budget 15m --review-p95 90s [--oversample 3] [--json]

Latency options:
  Use either p95 or mean+sd for generation and review.

Examples:
  napierce plan --generate-budget 20m --generation-p95 30s --review-budget 15m --review-p95 90s
  napierce plan --generate-budget 20m --generation-mean 20s --generation-sd 5s --review-budget 15m --review-mean 60s --review-sd 15s --lambda 2 --json
`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
