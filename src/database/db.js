import mongoose from "mongoose";
import { MONGO_URI } from "../config/envConfig.js";

export const connectDB = () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Check your environment variables.");
    process.exit(1);
  }

  mongoose
    .connect(MONGO_URI, {
      dbName: "bookhive",
    })
    .then(() => {
      console.log("Database connected successfully.");
    })
    .catch((err) => {
      console.log("Error connecting to database", err);
    });
};
