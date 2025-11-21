/**
 * Database Connection Module
 *
 * This module handles the connection to the MongoDB database using Mongoose.
 * It exports functions to establish and manage database connections.
 */

import mongoose from "mongoose";
import config from "./env";

const { mongodbUrl } = config;

/**
 * Establishes a connection to the MongoDB database.
 * Uses the configured MongoDB URI for all environments.
 * If the connection fails, it logs the error and exits the process.
 */
let isConnected = false;

export const connectDB = async (): Promise<void> => {
  // Check if already connected via mongoose directly
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    console.log('Using existing database connection');
    return;
  }

  if (!mongodbUrl) {
    throw new Error('MONGODB_URL is not defined in environment variables');
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(mongodbUrl, {
      serverSelectionTimeoutMS: 30000, // 30 seconds for serverless
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('Connection string (masked):', mongodbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@'));
    // Don't exit in production to allow for retries
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
    isConnected = false;
    throw error;
  }
};

/**
 * Ensures database connection is established.
 * In serverless environments, connections may be lost between requests.
 * This function checks if we're connected and reconnects if necessary.
 */
export const ensureDBConnection = async (): Promise<void> => {
  // Connection state constants
  const DISCONNECTED = 0;
  const CONNECTED = 1;
  
  // Check current state
  const readyState = mongoose.connection.readyState as number;
  
  if (readyState === CONNECTED) {
    return; // Already connected
  }
  
  // Reset connection flag if mongoose says we're disconnected
  if (readyState === DISCONNECTED) {
    isConnected = false;
  }
  
  // Try to connect
  if (!isConnected) {
    await connectDB();
  }
  
  // Final check - verify connection is active
  const finalState = mongoose.connection.readyState as number;
  if (finalState !== CONNECTED) {
    throw new Error(`Database connection is not active (state: ${finalState})`);
  }
};

/**
 * Closes the database connection.
 * Useful for cleanup in tests or graceful shutdown.
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("✅ Database disconnected successfully");
  } catch (error) {
    console.error("❌ Database disconnection error:", error);
  }
};
