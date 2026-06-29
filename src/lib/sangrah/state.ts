import fs from "fs";
import path from "path";
import type { SangrahState } from "./types";

const DEFAULT_STATE: SangrahState = {
  lastRun: "",
  processedFiles: [],
  booksAdded: 0,
  runs: [],
};

export function readState(stateFilePath: string): SangrahState {
  if (!fs.existsSync(stateFilePath)) return { ...DEFAULT_STATE };
  try {
    return JSON.parse(fs.readFileSync(stateFilePath, "utf-8")) as SangrahState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeState(
  stateFilePath: string,
  state: SangrahState,
  runSummary: { filesProcessed: number; newBooks: number },
): void {
  const now = new Date().toISOString();
  const updated: SangrahState = {
    ...state,
    lastRun: now,
    runs: [
      { date: now, ...runSummary },
      ...state.runs,
    ].slice(0, 20), // keep last 20 runs
  };

  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true });
  fs.writeFileSync(stateFilePath, JSON.stringify(updated, null, 2));
}

export function markFilesProcessed(
  state: SangrahState,
  files: string[],
): SangrahState {
  return {
    ...state,
    processedFiles: [...new Set([...state.processedFiles, ...files])],
  };
}
