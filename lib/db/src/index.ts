import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Support for mysql:// and mysql2:// URLs
const connectionString = process.env.DATABASE_URL.replace(/^mysql:/, "mysql2:");

// We create a pool instead of a single connection for better stability
export const pool = mysql.createPool(connectionString);

export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
