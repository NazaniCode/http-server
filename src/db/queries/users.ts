import { db } from "../index.js";
import { NewRefreshToken, NewUser, users, refreshTokens } from "../schema.js";
import { asc, desc, eq } from "drizzle-orm";
import { ForbiddenError } from "../../errors.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning()
  return result;
}

export async function updateUser(userId: string, details: { email: string, hashedPassword: string }) {
  const [result] = await db
    .update(users)
    .set(details)
    .where(eq(users.id, userId))
    .returning()
  return result;
}

export async function upgradeUser(userId: string) {
  const [result] = await db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, userId))
    .returning()
  return result;
}

export async function getUsers() {
  type SafeUser = Omit<NewUser, 'hashedPassword'>;

  const result: SafeUser[] = await db.query.users.findMany({
    columns: {
      hashedPassword: false
    }
  })
  return result;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))

  return user;
}

export async function resetUsers() {
  await db.delete(users);
}

export async function createRefreshToken(refreshToken: NewRefreshToken) {
  const [result] = await db
    .insert(refreshTokens)
    .values(refreshToken)
    .onConflictDoNothing()
    .returning()
  return result;
}

export async function revokeRefreshToken(token: string) {
  const [result] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.token, token))
    .returning()
  return result;
}

export async function getRefreshToken(token: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
  return result;
}
