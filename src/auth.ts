import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "./errors.js";
import { Request, Response, NextFunction, Router } from "express";
import { randomBytes } from "node:crypto";

export async function hashPassword(password: string) {
  return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string) {
  return argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  type payloadType = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

  const nowTime = Math.floor(Date.now() / 1000);
  const payload: payloadType = {
    iss: "chirpy",
    sub: userID,
    iat: nowTime,
    exp: nowTime + expiresIn
  }

  return jwt.sign(payload, secret);
}

export function validateJWTandReturnUserID(tokenString: string, secret: string): string {
  try {
    const token = jwt.verify(tokenString, secret);

    if (typeof token !== "object" || token === null) {
      throw new TypeError(`Invalid shape of decoded token data. Expected object got ${typeof token}`)
    }
    if (typeof token.sub !== "string") {
      throw new TypeError(`userID/sub: ${token.sub} property did not have correct type. Expected string got: ${typeof token.sub}`);
    }

    return token.sub;
  } catch (err) {
    throw new UnauthorizedError(`Invalid or expired token ${err}`)
  }
}

export function getBearerToken(req: Request): string {
  const token = req.headers.authorization;
  if (token) {
    const tokenString = token.trim().substring(7);
    return tokenString;
  } else {
    throw new UnauthorizedError(`The request required an Authorization header but didn't have any`);
  }
}

export function getAPIKey(req: Request): string {
  const token = req.headers.authorization;
  if (token) {
    const tokenString = token.trim().substring(7);
    return tokenString;
  } else {
    throw new UnauthorizedError(`The request required an Authorization header but didn't have any`);
  }
}

export function generateRefreshToken() {
  return randomBytes(32).toString("hex");
}
