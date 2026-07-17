import { createApp } from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";
import { env } from "./src/config/env.js";

const app = createApp();

try {
  await connectDatabase();
  console.log("Connected to MongoDB");
} catch (error) {
  process.exitCode = 1;
  throw error;
}

app.listen(env.port, () => {
  console.log(`Rihala backend listening on port ${env.port}`);
});
