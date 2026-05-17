import "dotenv/config";

import { LunarBot } from "@/bot.js";

const bot = new LunarBot();

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received, shutting down...`);
  await bot.stop();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT").catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM").catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
});
void bot.start().catch(async (error: unknown) => {
  console.error(error);
  await bot.stop().catch(() => undefined);
  process.exitCode = 1;
});
