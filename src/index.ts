import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from './config.js';
import { BadRequestsError, UnauthorizedError, ForbiddenError, NotFoundError } from "./errors.js";
import { apiRouter } from "./apiEndpoints.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = postgres(config.dbConfig.dbURL, { max: 1 });
await migrate(drizzle(migrationClient), config.dbConfig.migrationConfig);


const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));

app.use(apiRouter);

//Error handler SHOULD COME AFTER ALL OTHER API ENDPOINTS BEFORE LISTEN
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    const statusCode = res.statusCode;
    if (statusCode !== 200) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  })
  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.apiConfig.fileserverHits++;
  next();
}

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(err);
  if (err instanceof BadRequestsError) {
    res.status(400).send({ "error": `${err.message}` });
  }
  res.status(500).send();
}
