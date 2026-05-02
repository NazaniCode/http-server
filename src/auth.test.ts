import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWTandReturnUserID, hashPassword, checkPasswordHash, getBearerToken, getAPIKey } from "./auth.js";
import { Request, Response, NextFunction, Router } from "express";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    const result2 = await checkPasswordHash(password2, hash2);
    expect(result).toBe(true);
    expect(result2).toBe(true);
  });

  it("should return false for the incorrect password", async () => {
    const result = await checkPasswordHash(password1, hash2);
    const result2 = await checkPasswordHash(password2, hash1);
    expect(result).toBe(false);
    expect(result2).toBe(false);
  })
});

describe("JWT Token Generation", () => {
  const serverJWTSecret = "1234";
  const userID1 = "Nazani";
  let token: string;

  beforeAll(async () => {
    token = makeJWT(userID1, 3600, serverJWTSecret);
  });

  it("should return correct userID on correct Token", async () => {
    const result = validateJWTandReturnUserID(token, serverJWTSecret);
    expect(result).toBe(userID1);
  });

  it("should throw error on invalid secret", async () => {
    expect(() => validateJWTandReturnUserID(token, "4321")).toThrow();
  })

  it("should throw error on invalid token", async () => {
    expect(() => validateJWTandReturnUserID("invalid", serverJWTSecret)).toThrow();
  })
});

describe("Getting Bearer Token", () => {
  const req = {
    headers: {
      authorization: "Bearer abc123"
    }
  } as unknown as Request

  it("should return bearer token when Authorization header exists", async () => {
    const token = getBearerToken(req);
    expect(token).toBe("abc123");
  })
})

describe("Getting auth api key", () => {
  const req = {
    headers: {
      authorization: "ApiKey abc123"
    }
  } as unknown as Request

  it("should return auth api key when Authorization header exists", async () => {
    const token = getAPIKey(req);
    expect(token).toBe("abc123");
  })
})
