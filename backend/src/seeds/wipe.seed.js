import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../core/database/mongodb.js";

const wipeDatabase = async () => {
  console.log("----------------------------------------");
  console.log("🗑️  Starting Database Wipe Script...");
  console.log("----------------------------------------");

  try {
    await connectDatabase();
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;
    const collections = await db.collections();

    if (collections.length === 0) {
      console.log("Database has no collections to wipe.");
    } else {
      console.log(`Found ${collections.length} collection(s) to wipe:\n`);

      for (const collection of collections) {
        const count = await collection.countDocuments().catch(() => 0);
        try {
          await collection.drop();
          console.log(`  ✓ Dropped collection: ${collection.collectionName} (${count} docs)`);
        } catch (err) {
          // If drop fails due to namespace, try deleting all documents
          await collection.deleteMany({});
          console.log(`  ✓ Cleared documents in: ${collection.collectionName}`);
        }
      }
    }

    console.log("\n✅ Database wipe completed successfully.");

  } catch (error) {
    console.error("❌ Error during database wipe:", error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Database connection closed.");
    }
  }
};

wipeDatabase();
