import { db } from "../index.js";
import { users, refreshTokens } from "../schema.js";
import { eq } from "drizzle-orm";
export async function createUser(user) {
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function updateUser(userId, details) {
    const [result] = await db
        .update(users)
        .set(details)
        .where(eq(users.id, userId))
        .returning();
    return result;
}
export async function upgradeUser(userId) {
    const [result] = await db
        .update(users)
        .set({ isChirpyRed: true })
        .where(eq(users.id, userId))
        .returning();
    return result;
}
export async function getUsers() {
    const result = await db.query.users.findMany({
        columns: {
            hashedPassword: false
        }
    });
    return result;
}
export async function getUserByEmail(email) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
    return user;
}
export async function resetUsers() {
    await db.delete(users);
}
export async function createRefreshToken(refreshToken) {
    const [result] = await db
        .insert(refreshTokens)
        .values(refreshToken)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function revokeRefreshToken(token) {
    const [result] = await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.token, token))
        .returning();
    return result;
}
export async function getRefreshToken(token) {
    const [result] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token));
    return result;
}
