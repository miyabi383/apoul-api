import { prisma } from "@apoul/db";
import { startHealthServer } from "./health.js";
import { runWorkerLoop } from "./processor.js";

const pollMs = Number(process.env.WORKER_POLL_MS ?? 1000);
const healthPort = Number(process.env.WORKER_HEALTH_PORT ?? 4200);

async function main() {
  await prisma.$connect();
  startHealthServer(healthPort);
  console.log("[@apoul/worker] started poll=%dms health=:%d", pollMs, healthPort);

  const ac = new AbortController();
  process.on("SIGINT", () => ac.abort());
  process.on("SIGTERM", () => ac.abort());

  await runWorkerLoop(pollMs, ac.signal);
  await prisma.$disconnect();
  console.log("[@apoul/worker] stopped");
}

main().catch((e) => {
  console.error("[@apoul/worker] fatal", e);
  process.exit(1);
});
