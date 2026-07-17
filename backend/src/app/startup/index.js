import { initializeDatabase } from "./database.js";

export async function initializeStartup() {
  await initializeDatabase();
}
