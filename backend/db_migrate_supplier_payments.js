import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const result = await mongoose.connection.collection('supplierpayments').updateMany(
        {},
        { $rename: { "date": "paymentDate" } }
      );
      console.log(`Matched ${result.matchedCount} documents, modified ${result.modifiedCount} documents.`);
    } catch (error) {
      console.error("Migration failed:", error);
    } finally {
      process.exit(0);
    }
  });
