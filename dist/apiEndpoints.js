import { Router } from "express";
import { config } from "./config.js";
import { BadRequestsError } from "./errors.js";
import * as usersQueries from "./db/queries/users.js";
import * as chirpQueries from "./db/queries/chirps.js";
export const apiRouter = Router();
//API endpoints
apiRouter.get("/admin/metrics", writeNumRequests);
apiRouter.post("/admin/reset", resetContent);
apiRouter.get("/api/healthz", handlerReadiness);
apiRouter.post("/api/users", createUser);
apiRouter.get("/api/users", getUsers);
apiRouter.post("/api/chirps", createChirp);
apiRouter.get("/api/chirps", getChirps);
apiRouter.get("/api/chirps/:chirpId", getChirps);
function handlerReadiness(req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}
function writeNumRequests(req, res, next) {
    res.set("Content-Type", "text/html; charset=utf-8");
    const html = `
    <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.apiConfig.fileserverHits} times!</p>
      </body>
    </html>
  `;
    res.send(html);
    next();
}
async function resetContent(req, res, next) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    if (config.apiConfig.platform !== "dev") {
        res.status(403).send("NOT OK");
    }
    try {
        await usersQueries.resetUsers();
        config.apiConfig.fileserverHits = 0;
        res.status(200).send("OK");
    }
    catch (err) {
        next(err);
    }
}
async function createUser(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const parsedBody = await req.body;
        const email = parsedBody.email;
        const newUser = await usersQueries.createUser({ email: email });
        const response = {
            "id": newUser.id,
            "email": newUser.email,
            "createdAt": newUser.createdAt,
            "updatedAt": newUser.updatedAt
        };
        res.status(201).send(response);
    }
    catch (err) {
        next(err);
    }
}
async function getUsers(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const users = await usersQueries.getUsers();
        res.status(200).send(users);
    }
    catch (err) {
        next(err);
    }
}
async function resetUsers(req, res, next) {
}
function censorString(str) {
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    const split = str.split(" ");
    for (let i = 0; i < split.length; i++) {
        if (badWords.includes(split[i].toLowerCase())) {
            split[i] = "****";
        }
    }
    return split.join(" ");
}
async function createChirp(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const parsedBody = await req.body;
        const userId = parsedBody.userId;
        const chirpBody = parsedBody.body;
        if (chirpBody.length > 140) {
            throw new BadRequestsError("Chirp is too long. Max length is 140");
        }
        else {
            const newChirp = await chirpQueries.createChirp({ body: chirpBody, userId: userId });
            const response = {
                "id": newChirp.id,
                "createdAt": newChirp.createdAt,
                "updatedAt": newChirp.updatedAt,
                "body": newChirp.body,
                "userId": newChirp.userId
            };
            res.status(201).send(response);
        }
    }
    catch (err) {
        next(err);
    }
}
async function getChirps(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        if (req.params.chirpId) {
            const chirp = await chirpQueries.getChirp(req.params.chirpId);
            if (chirp) {
                res.status(200).send(chirp);
            }
            else {
                res.status(404).send();
            }
        }
        else {
            const chirps = await chirpQueries.getChirps();
            res.status(200).send(chirps);
        }
    }
    catch (err) {
        next(err);
    }
}
