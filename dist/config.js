process.loadEnvFile();
export function envOrThrow(key) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
        throw new Error(`Critical startup error: Environment variable "${key} is required but was not found`);
    }
    return value;
}
const apiConfig = {
    fileserverHits: 0,
    platform: envOrThrow("PLATFORM"),
    polkaKey: envOrThrow("POLKA_KEY")
};
const migrationConfig = {
    migrationsFolder: "./src/db/migrations",
};
const dbConfig = {
    dbURL: envOrThrow('DB_URL'),
    migrationConfig: migrationConfig
};
export const config = {
    apiConfig: apiConfig,
    dbConfig: dbConfig,
    JWTSecret: envOrThrow("JWT_SECRET"),
};
