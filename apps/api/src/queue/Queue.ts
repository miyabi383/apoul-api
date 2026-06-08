// src/server/queue/Queue.ts

export interface Queue {
  enqueue(jobId: bigint): Promise<void>;
}
