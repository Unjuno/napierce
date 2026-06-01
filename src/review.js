import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readFile } from "node:fs/promises";
import { appendJsonl } from "./jsonl.js";

const ACTION_MAP = {
  a: "accept",
  r: "reject",
  s: "skip",
  m: "maybe",
  b: "best_so_far",
  q: "quit",
};

export async function runReviewSession({ candidates, criteriaPath, outPath, reviewerId = "local_user" }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("review requires at least one candidate.");
  }

  const criteria = criteriaPath ? await readFile(criteriaPath, "utf8") : null;
  const rl = createInterface({ input, output });
  const written = [];

  try {
    if (criteria) {
      console.log("Review criteria");
      console.log("");
      console.log(criteria.trim());
      console.log("");
    }

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = normalizeCandidate(candidates[index], index);
      const openedAt = new Date();

      console.log(`Candidate ${index + 1} / ${candidates.length}`);
      console.log(`ID: ${candidate.candidate_id}`);
      console.log("");
      console.log(candidate.content);
      console.log("");

      const action = await askAction(rl);
      const actedAt = new Date();

      if (action === "quit") {
        break;
      }

      const score = await askScore(rl);
      const note = await rl.question("Note (optional): ");
      const elapsedSeconds = (actedAt.getTime() - openedAt.getTime()) / 1000;

      const event = {
        event_id: `evt_${Date.now()}_${index + 1}`,
        candidate_id: candidate.candidate_id,
        reviewer_id: reviewerId,
        opened_at: openedAt.toISOString(),
        acted_at: actedAt.toISOString(),
        elapsed_seconds: Number(elapsedSeconds.toFixed(3)),
        action,
        score,
        note: note.trim() === "" ? undefined : note.trim(),
      };

      await appendJsonl(outPath, event);
      written.push(event);
      console.log("Recorded.");
      console.log("");
    }
  } finally {
    rl.close();
  }

  return written;
}

export function normalizeCandidate(candidate, index = 0) {
  if (typeof candidate === "string") {
    return {
      candidate_id: `cand_${String(index + 1).padStart(3, "0")}`,
      content: candidate,
    };
  }

  if (typeof candidate !== "object" || candidate == null) {
    throw new Error("candidate must be a string or object.");
  }

  const candidateId = candidate.candidate_id ?? candidate.id ?? `cand_${String(index + 1).padStart(3, "0")}`;
  const content = candidate.content ?? candidate.text ?? candidate.body;

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error(`candidate ${candidateId} must contain content, text, or body.`);
  }

  return {
    ...candidate,
    candidate_id: String(candidateId),
    content,
  };
}

async function askAction(rl) {
  while (true) {
    const answer = (await rl.question("Action [a=accept, r=reject, s=skip, m=maybe, b=best, q=quit]: ")).trim().toLowerCase();
    const action = ACTION_MAP[answer];
    if (action) return action;
    console.log("Invalid action.");
  }
}

async function askScore(rl) {
  while (true) {
    const answer = (await rl.question("Score 1-5 (blank for none): ")).trim();
    if (answer === "") return undefined;

    const score = Number(answer);
    if (Number.isInteger(score) && score >= 1 && score <= 5) {
      return score;
    }

    console.log("Invalid score.");
  }
}
