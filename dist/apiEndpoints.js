import { Router } from "express";
import { config } from "./config.js";
import { BadRequestsError, UnauthorizedError, ForbiddenError, NotFoundError } from "./errors.js";
import * as usersQueries from "./db/queries/users.js";
import * as chirpQueries from "./db/queries/chirps.js";
import { hashPassword, checkPasswordHash as checkPasswordHash, makeJWT, getBearerToken, validateJWTandReturnUserID, generateRefreshToken, getAPIKey } from "./auth.js";
export const apiRouter = Router();
//API endpoints
apiRouter.get("/admin/metrics", writeNumRequests);
apiRouter.post("/admin/reset", resetContent);
apiRouter.get("/api/healthz", handlerReadiness);
apiRouter.post("/api/users", createUser);
apiRouter.get("/api/users", getUsers);
apiRouter.put("/api/users", updateUserDetails);
apiRouter.post("/api/chirps", createChirp);
apiRouter.get("/api/chirps", getChirps);
apiRouter.post("/api/login", userLogin);
apiRouter.post("/api/refresh", getAccessTokenFromRefreshToken);
apiRouter.post("/api/revoke", revokeRefreshToken);
apiRouter.get("/api/chirps/:chirpId", getChirps);
apiRouter.delete("/api/chirps/:chirpId", deleteChirp);
// Webhooks
apiRouter.post("/api/polka/webhooks", upgradeUser);
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
        throw new ForbiddenError("NOT OK");
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
        const password = await hashPassword(parsedBody.password);
        const newUser = await usersQueries.createUser({ email: email, hashedPassword: password });
        if (!newUser) {
            throw new ForbiddenError("Could not create user. Email may already exist");
        }
        const response = {
            "id": newUser.id,
            "email": newUser.email,
            "createdAt": newUser.createdAt,
            "updatedAt": newUser.updatedAt,
            "isChirpyRed": newUser.isChirpyRed
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
async function updateUserDetails(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const accessToken = getBearerToken(req);
        const userId = validateJWTandReturnUserID(accessToken, config.JWTSecret);
        const requestBody = await req.body;
        const newDetails = {
            email: requestBody.email,
            hashedPassword: await hashPassword(requestBody.password)
        };
        const updatedUser = await usersQueries.updateUser(userId, newDetails);
        const response = {
            "id": updatedUser.id,
            "email": updatedUser.email,
            "createdAt": updatedUser.createdAt,
            "updatedAt": updatedUser.updatedAt,
            "isChirpyRed": updatedUser.isChirpyRed
        };
        res.status(200).send(response);
    }
    catch (err) {
        next(err);
    }
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
        const jwtToken = getBearerToken(req);
        const userId = validateJWTandReturnUserID(jwtToken, config.JWTSecret);
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
        const { chirpId } = req.params;
        let authorId = "";
        let authorIdQuery = req.query.authorId;
        if (typeof authorIdQuery === "string") {
            authorId = authorIdQuery;
        }
        let sort = "asc";
        let sortQuery = req.query.sort;
        if (sortQuery === "asc" || sortQuery === "desc") {
            sort = sortQuery;
        }
        if (chirpId instanceof Array) {
            throw new BadRequestsError("cannot have more than one chirpId parameters");
        }
        else if (chirpId) {
            const chirp = await chirpQueries.getChirp(chirpId);
            if (chirp) {
                res.status(200).send(chirp);
            }
            else {
                throw new NotFoundError("chirp not found");
            }
        }
        else {
            if (authorId) {
                const chirps = await chirpQueries.getChirpsByAuthor(authorId, sort);
                res.status(200).send(chirps);
            }
            else {
                const chirps = await chirpQueries.getChirps(sort);
                res.status(200).send(chirps);
            }
        }
    }
    catch (err) {
        next(err);
    }
}
async function deleteChirp(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const { chirpId } = req.params;
        if (chirpId instanceof Array) {
            throw new BadRequestsError("cannot have more than one chirpId parameters");
        }
        else if (chirpId) {
            const accessToken = getBearerToken(req);
            const userId = validateJWTandReturnUserID(accessToken, config.JWTSecret);
            const chirp = await chirpQueries.getChirp(chirpId);
            if (chirp) {
                if (chirp.userId === userId) {
                    await chirpQueries.deleteChirp(chirp.id);
                    res.status(204).send(`Chirp delted successfully`);
                }
                else {
                    throw new ForbiddenError("User does not have access to that chirp");
                }
            }
            else {
                throw new NotFoundError("Chirp not found");
            }
        }
    }
    catch (err) {
        next(err);
    }
}
async function userLogin(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const parsedBody = req.body;
        const user = await usersQueries.getUserByEmail(parsedBody.email);
        const isCorrectUser = user ? await checkPasswordHash(parsedBody.password, user.hashedPassword) : false;
        if (!isCorrectUser) {
            throw new UnauthorizedError("Incorrect email or password");
        }
        else {
            const jwtExpirationTime = 3600; // 1 hour
            const jwtToken = makeJWT(user.id, jwtExpirationTime, config.JWTSecret);
            const refreshExpirationDate = new Date();
            refreshExpirationDate.setDate(refreshExpirationDate.getDate() + 60);
            const refreshToken = {
                userId: user.id,
                token: generateRefreshToken(),
                expiresAt: refreshExpirationDate
            };
            await usersQueries.createRefreshToken(refreshToken);
            const response = {
                id: user.id,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                email: user.email,
                token: jwtToken,
                refreshToken: refreshToken.token,
                isChirpyRed: user.isChirpyRed
            };
            res.status(200).send(response);
        }
    }
    catch (err) {
        next(err);
    }
}
async function getAccessTokenFromRefreshToken(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const bearerToken = getBearerToken(req);
        const refreshToken = await usersQueries.getRefreshToken(bearerToken);
        if (refreshToken && refreshToken.expiresAt >= new Date() && !refreshToken.revokedAt) {
            const accessToken = makeJWT(refreshToken.userId, 3600, config.JWTSecret);
            const response = {
                token: accessToken
            };
            res.status(200).send(response);
        }
        else {
            throw new UnauthorizedError("Unauthorized: Refresh token expired, revoked or invalid");
        }
    }
    catch (err) {
        next(err);
    }
}
async function revokeRefreshToken(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const bearerToken = getBearerToken(req);
        const revokedToken = await usersQueries.revokeRefreshToken(bearerToken);
        if (!revokedToken) {
            throw new UnauthorizedError("Unauthorized: Refresh token invalid");
        }
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
async function upgradeUser(req, res, next) {
    res.set("Content-Type", "application/json");
    try {
        const requestParsed = req.body;
        if (requestParsed.event !== "user.upgraded") {
            res.status(204).send("upgradeUser webhook did not receive correct request");
        }
        else {
            if (getAPIKey(req) !== config.apiConfig.polkaKey) {
                throw new UnauthorizedError(`Request key: ${getAPIKey(req)} Correct key: ${config.apiConfig.polkaKey}`);
            }
            else {
                const upgradedUser = await usersQueries.upgradeUser(requestParsed.data.userId);
                if (upgradedUser) {
                    res.status(204).send();
                }
                else {
                    throw new NotFoundError("didn't find the user that needed to upgrade");
                }
            }
        }
    }
    catch (err) {
        next(err);
    }
}
