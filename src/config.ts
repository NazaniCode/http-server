process.loadEnvFile();
import type { MigrationConfig } from "drizzle-orm/migrator";


export function envOrThrow(key: string): string {
  const value = process.env[key];

  if (!value || value.trim() === "") {
    throw new Error(`Critical startup error: Environment variable "${key} is required but was not found`);
  }

  return value;
}


type APIConfig = {
  fileserverHits: number,
  platform: string,
  polkaKey: string
};

type DBConfig = {
  dbURL: string,
  migrationConfig: MigrationConfig
}

type Config = {
  apiConfig: APIConfig,
  dbConfig: DBConfig,
  JWTSecret: string,
}

const apiConfig: APIConfig = {
  fileserverHits: 0,
  platform: envOrThrow("PLATFORM"),
  polkaKey: envOrThrow("POLKA_KEY")
};

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
}

const dbConfig: DBConfig = {
  dbURL: envOrThrow('DB_URL'),
  migrationConfig: migrationConfig
}

export const config: Config = {
  apiConfig: apiConfig,
  dbConfig: dbConfig,
  JWTSecret: envOrThrow("JWT_SECRET"),
}
