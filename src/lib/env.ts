// src/lib/env.ts
export function getRequiredEnvVar(name: string): string {
  // Check both process.env (Docker/production runtime) and import.meta.env (local dev/build-time)
  // Priority: process.env first (runtime), then import.meta.env (build-time/local dev)
  const processValue =
    typeof process !== "undefined" && process.env ? process.env[name] : undefined;
  const metaValue = import.meta.env[name];
  
  const value = processValue || metaValue;

  if (!value) {
    throw new Error(
      `❌ Missing required environment variable: ${name}\n\n` +
      `Checked process.env and import.meta.env.\n` +
      `Make sure the variable exists in .env (local) or runtime env (production).`
    );
  }

  return value;
}
