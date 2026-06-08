// test/helpers/mockBilling.ts

import { createServer, type Server } from "node:http";

export type MockBilling = {
  server: Server;
  port: number;
  dispatches: Array<{ key: string; body: unknown }>;
  close: () => Promise<void>;
};

export async function startMockBilling(): Promise<MockBilling> {
  const dispatches: Array<{ key: string; body: unknown }> = [];
  const server = createServer(async (req, res) => {
    if (req.method === "POST" && req.url?.startsWith("/mock/billing/invoices")) {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      const key = req.headers["idempotency-key"]?.toString() ?? "";
      dispatches.push({ key, body });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 4101;

  return {
    server,
    port,
    dispatches,
    close: () => new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}
