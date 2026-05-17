import { db } from "./lib/db/src/index.js";
import { users } from "./lib/db/src/schema.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log("Total users in DB:", allUsers.length);
    console.log("Users:", JSON.stringify(allUsers, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error checking users:", err);
    process.exit(1);
  }
}

checkUsers();
