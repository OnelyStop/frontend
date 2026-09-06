// Calls the stage functions directly, no HTTP; bun auto-loads .env.local.
import { runGenerate } from "@/features/current-affairs/pipeline/generate";
import { runIngest } from "@/features/current-affairs/pipeline/ingest";

const [stage, ...rest] = process.argv.slice(2);
const day = rest.find((a) => a.startsWith("--day="))?.slice("--day=".length);

async function main() {
  if (stage === "ingest") {
    console.log(JSON.stringify(await runIngest(), null, 2));
  } else if (stage === "generate") {
    console.log(JSON.stringify(await runGenerate(day), null, 2));
  } else {
    console.error(
      "usage: bun run pipeline <ingest|generate> [--day=YYYY-MM-DD]",
    );
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
