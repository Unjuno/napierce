#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { parseDurationToSeconds } from "../src/duration.js";
import { formatPlanText } from "../src/format.js";
import { readJsonl } from "../src/jsonl.js";
import { createPlan } from "../src/plan.js";
import { runReviewSession } from "../src/review.js";
import { formatSummaryText, summarizeReviewEvents } from "../src/summarize.js";

async function main(argv) {
  const [command, ...args] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const options = parseArgs(args);

  if (command === "plan") {
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

    printOutput(plan, options, formatPlanText);
    return;
  }

  if (command === "review") {
    const candidatesPath = requiredString(options, "candidates");
    const outPath = requiredString(options, "out");
    const candidates = await readJsonl(candidatesPath);
    const written = await runReviewSession({
      candidates,
      criteriaPath: options.criteria,
      outPath,
      reviewerId: options.reviewer ?? "local_user",
    });

    const result = {
      written_events: written.length,
      out: outPath,
    };

    printOutput(result, options, (value) => `Recorded ${value.written_events} review events to ${value.out}`);
    return;
  }

  if (command === "summarize") {
    const eventsPath = requiredString(options, "events");
    const events = await readJsonl(eventsPath);
    const plan = options.plan ? JSON.parse(await readFile(options.plan, "utf8")) : null;
    const summary = summarizeReviewEvents(events, plan);

    printOutput(summary, options, formatSummaryText);
    return;
  }

  throw new Error(`unknown command: ${command}`);
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

function printOutput(value, options, formatter) {
  if (options.json === true) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(formatter(value));
  }
}

function requiredString(options, name) {
  if (options[name] == null || String(options[name]).trim() === "") {
    throw new Error(`--${name} is required.`);
  }
  return String(options[name]);
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
  napierce review --candidates candidates.jsonl --out review-events.jsonl [--criteria criteria.md] [--json]
  napierce summarize --events review-events.jsonl [--plan plan.json] [--json]

Latency options:
  Use either p95 or mean+sd for generation and review.

Examples:
  napierce plan --generate-budget 20m --generation-p95 30s --review-budget 15m --review-p95 90s
  napierce plan --generate-budget 20m --generation-mean 20s --generation-sd 5s --review-budget 15m --review-mean 60s --review-sd 15s --lambda 2 --json
  napierce summarize --events review-events.jsonl --json
`);
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
