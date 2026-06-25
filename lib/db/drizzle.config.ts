import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Append sslmode=require for Render/production if not already set
function getDbUrl() {
  const url = process.env.DATABASE_URL as string;
  if (url.includes("sslmode") || url.includes("localhost") || url.includes("127.0.0.1")) {
    return url;
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}sslmode=require`;
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});
