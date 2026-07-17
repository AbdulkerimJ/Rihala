import { connectDatabase } from "../../database/connect.js";

export async function initializeDatabase() {
  await connectDatabase();
}
