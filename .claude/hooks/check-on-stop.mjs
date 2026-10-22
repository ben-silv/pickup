// Claude Code "Stop" hook: before Claude finishes a turn, run `npm run check` (lint + typecheck + unit tests).
// If it fails, exit 2 so Claude keeps working and sees the errors. Skips when nothing has changed, and gives up
// after 3 failed attempts in a row so a problem Claude can't fix doesn't loop forever.
// Plain Node with no dependencies, so it runs the same on Windows, macOS and Linux.
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_ATTEMPTS = 3;
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const stateDir = join(projectDir, ".claude", ".hook-state");
const stateFile = join(stateDir, "check-attempts.json");

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // No or bad input: treat as a fresh stop.
}
const session = String(input.session_id ?? "unknown");

function readAttempts() {
  try {
    const s = JSON.parse(readFileSync(stateFile, "utf8"));
    return s.session === session ? s.attempts : 0;
  } catch {
    return 0;
  }
}
function writeAttempts(attempts) {
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify({ session, attempts }));
}

// Nothing changed since the last commit (e.g. Claude just answered a question): no need to check.
try {
  const changes = execSync("git status --porcelain -- src tests supabase", { cwd: projectDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (!changes.trim()) process.exit(0);
} catch {
  // Not a git repo: check anyway.
}

const run = spawnSync("npm run check", { cwd: projectDir, shell: true, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
if (run.status === 0) {
  writeAttempts(0);
  process.exit(0);
}

const attempts = readAttempts() + 1;
writeAttempts(attempts);
if (attempts > MAX_ATTEMPTS) {
  writeAttempts(0);
  // Let Claude stop, but make sure the failure is reported to the human.
  console.log(
    JSON.stringify({
      systemMessage: `npm run check is still failing after ${MAX_ATTEMPTS} attempts. Stopping so you can take a look.`,
    }),
  );
  process.exit(0);
}

const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`.trim().split("\n").slice(-60).join("\n");
process.stderr.write(
  `npm run check failed (attempt ${attempts} of ${MAX_ATTEMPTS}). Fix these before finishing, then summarize what you changed.\n\n${output}\n`,
);
process.exit(2);
