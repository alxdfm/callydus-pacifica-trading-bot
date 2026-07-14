// Entry local de desenvolvimento: invoca o handler uma vez e sai.
// Em produção o handler é invocado direto pelo Cron do SST (sst.config.ts) —
// este arquivo não é bundlado no deploy.
import { handler } from "./handler.js";

const result = await handler();
console.info("[dev] handler finished", result);
