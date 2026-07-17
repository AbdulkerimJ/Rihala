import { createApp } from "./src/app/app.js";
import { env } from "./src/config/env.js";
import { initializeStartup } from "./src/app/startup/index.js";

const app = createApp();

await initializeStartup();

app.listen(env.port, () => {
  console.log(`Rihala backend listening on port ${env.port}`);
});
