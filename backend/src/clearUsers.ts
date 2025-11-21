import mongoose from "mongoose";
import dotenv from "dotenv";
import { userModel } from "./models/userModel";

//Hello

dotenv.config();

async function clearUsers() {
  try {
    // Connect to MongoDB using MONGODB_URL from env
    await mongoose.connect(process.env.MONGODB_URL!);
    // Delete all users
    const result = await userModel.deleteMany({});
  } catch (error) {
    console.error("Error clearing users:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
  }
}

clearUsers();
