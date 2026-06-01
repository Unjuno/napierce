import { readFile, appendFile } from "node:fs/promises";

export async function readJsonl(filePath) {
  const text = await readFile(filePath, "utf8");
  return parseJsonl(text, filePath);
}

export function parseJsonl(text, sourceName = "JSONL input") {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.trim() !== "")
    .map(({ line, lineNumber }) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${sourceName}:${lineNumber} is not valid JSON: ${error.message}`);
      }
    });
}

export async function appendJsonl(filePath, record) {
  await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
}
