import { processNextJob } from "../../api/src/services/jobProcessor.js";

export async function runWorkerTick(): Promise<boolean> {
  return processNextJob();
}

export async function runWorkerLoop(pollMs: number, signal: AbortSignal): Promise<void> {
  while (!signal.aborted) {
    const processed = await runWorkerTick();
    if (!processed) {
      await sleep(pollMs, signal);
    }
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
