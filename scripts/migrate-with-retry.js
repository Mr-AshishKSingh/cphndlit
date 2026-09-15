// Neon's serverless Postgres suspends when idle, so the first connection
// after a period of inactivity (e.g. right at the start of a fresh Vercel
// build) can time out once before the compute wakes up. Retry a few times
// with a short delay instead of failing the whole deployment on that.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain Node script, run directly via `node`
const { execSync } = require("node:child_process");

const MAX_ATTEMPTS = 4;
const DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      console.log(`\nmigrate deploy failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${DELAY_MS / 1000}s...\n`);
      await sleep(DELAY_MS);
    }
  }
}

main().catch(() => process.exit(1));
