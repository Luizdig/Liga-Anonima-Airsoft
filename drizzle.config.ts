import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = (() => {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to run drizzle-kit commands");
  }

  // This logic is specific to Neon's connection pooler, which requires disabling prepared statements.
  if (
    url.includes("pooler.aws.neon.tech") &&
    !url.includes("options=--no-prepare")
  ) {
    // Append the option to disable prepared statements.
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}options=--no-prepare`;
  }

  return url;
})();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
