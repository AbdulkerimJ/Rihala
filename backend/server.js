import dotenv from "dotenv";
import app from "./src/app.js";
import connectDatabase from "./src/core/database/mongodb.js";

dotenv.config();

const port = process.env.PORT || 5000;

// Database connection
try {
  await connectDatabase();
  console.log("Connected to MongoDB");
} catch (error) {
  process.exitCode = 1;
  throw error;
}

// Start the server
app.listen(port, () => {
  console.log(`Rihala backend listening on port ${port}`);
});
