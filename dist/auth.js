import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./errors.js";
import { randomBytes } from "node:crypto";
export async function hashPassword(password) {
    return await argon2.hash(password);
}
export async function checkPasswordHash(password, hash) {
    return argon2.verify(hash, password);
}
export function makeJWT(userID, expiresIn, secret) {
    const nowTime = Math.floor(Date.now() / 1000);
    const payload = {
        iss: "chirpy",
        sub: userID,
        iat: nowTime,
        exp: nowTime + expiresIn
    };
    return jwt.sign(payload, secret);
}
export function validateJWTandReturnUserID(tokenString, secret) {
    try {
        const token = jwt.verify(tokenString, secret);
        if (typeof token !== "object" || token === null) {
            throw new TypeError(`Invalid shape of decoded token data. Expected object got ${typeof token}`);
        }
        if (typeof token.sub !== "string") {
            throw new TypeError(`userID/sub: ${token.sub} property did not have correct type. Expected string got: ${typeof token.sub}`);
        }
        return token.sub;
    }
    catch (err) {
        throw new UnauthorizedError(`Invalid or expired token ${err}`);
    }
}
export function getBearerToken(req) {
    const token = req.headers.authorization;
    if (token) {
        const tokenString = token.trim().substring(7);
        return tokenString;
    }
    else {
        throw new UnauthorizedError(`The request required an Authorization header but didn't have any`);
    }
}
export function getAPIKey(req) {
    const token = req.headers.authorization;
    if (token) {
        const tokenString = token.trim().substring(7);
        return tokenString;
    }
    else {
        throw new UnauthorizedError(`The request required an Authorization header but didn't have any`);
    }
}
export function generateRefreshToken() {
    return randomBytes(32).toString("hex");
}
