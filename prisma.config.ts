import "dotenv/config";
import { defineConfig } from "prisma/config";

import {
  getDatabaseProvider,
  prepareSchema,
  resolveDatabaseUrl,
} from "./prisma/provider";

// SQLite when DATABASE_URL is "file:…" (or unset in development),
// PostgreSQL when it is "postgresql://…". See prisma/provider.ts.
const url = resolveDatabaseUrl();
const { schema, migrations } = prepareSchema(getDatabaseProvider(url));

export default defineConfig({
  schema,
  migrations: {
    path: migrations,
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
