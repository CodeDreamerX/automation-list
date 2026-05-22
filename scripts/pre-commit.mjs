/**
 * Pre-commit test runner — stdout/stderr stream live; failures are impossible to miss on Windows.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function showWindowsFailureDialog() {
  const message =
    "Tests failed. Commit blocked.\\n\\nOpen a terminal and run: npm test";
  const ps = [
    "-NoProfile",
    "-Command",
    `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${message}', 'Commit blocked — tests failed', 0, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null`,
  ];
  spawnSync("powershell.exe", ps, { stdio: "ignore" });
}

function fail(status) {
  process.stderr.write("\n");
  process.stderr.write("================================================\n");
  process.stderr.write("  COMMIT BLOCKED — tests failed\n");
  process.stderr.write("  Run: npm test\n");
  process.stderr.write("================================================\n");
  process.stderr.write("\n");
  if (isWin) showWindowsFailureDialog();
  process.exit(status || 1);
}

process.stdout.write("\n▶ PRE-COMMIT: running npm test...\n\n");

const result = spawnSync(npm, ["test"], {
  cwd: root,
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

if (result.status !== 0) {
  fail(result.status);
}

process.stdout.write("\n✓ PRE-COMMIT: all tests passed.\n\n");
process.exit(0);
