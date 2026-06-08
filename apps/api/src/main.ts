// apps/api/src/main.ts

import { validateApiEnv } from "./config/env";
import { buildApp } from "./app";

validateApiEnv();

const app = buildApp();
const port = Number(process.env.PORT ?? 4100);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`APOUL API listening on :${port}`))
  .catch((e) => {
    app.log.error(e);
    process.exit(1);
  });
